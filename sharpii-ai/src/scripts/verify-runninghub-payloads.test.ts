
import { RunningHubProvider } from '../services/ai-providers/runninghub/runninghub-provider'
import { ProviderConfig } from '../services/ai-providers/common/types'
import fs from 'fs'
import path from 'path'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock console.log to capture output
const originalConsoleLog = console.log
const logs: string[] = []
console.log = (...args) => {
  logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
  // originalConsoleLog(...args) // Uncomment to see logs in terminal
}

describe('RunningHub Payload Verification', () => {
  let provider: RunningHubProvider

  beforeEach(() => {
    mockFetch.mockClear()
    logs.length = 0

    const config: ProviderConfig = {
      apiKey: 'test-api-key',
      baseUrl: 'https://www.runninghub.ai'
    }
    provider = new RunningHubProvider(config)
  })

  afterAll(() => {
    console.log = originalConsoleLog
  })

  test('Scenario 1: Smart Upscale Disabled', async () => {
    // Mock image download
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      json: () => Promise.reject(new Error('Not JSON'))
    }))

    // Mock upload to RunningHub
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ code: 0, data: { url: 'https://test.com/uploaded.jpg' } })
    }))

    // Mock task creation
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ code: 0, data: { taskId: 'task-123' } })
    }))

    // Mock task status (SUCCESS)
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ code: 0, data: 'SUCCESS' })
    }))

    // Mock task outputs (return both to see if logic filters them, but mainly we want to check request payload)
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        code: 0,
        data: [
          { nodeId: '136', fileUrl: 'http://out.put/136.png' },
          { nodeId: '215', fileUrl: 'http://out.put/215.png' }
        ]
      })
    }))

    const request = {
      imageUrl: 'https://i.postimg.cc/2yhK39Yf/33de69f6-cc72-4b13-9430-4be047113364-(1)-(1).jpg',
      userId: 'user-123',
      imageId: 'img-123',
      settings: {
        smartUpscale: false,
        prompt: 'test prompt',
        mode: 'Subtle'
      }
    }

    // Spy on pollTaskCompletion to verify expectedNodeIds
    const pollSpy = jest.spyOn(provider as any, 'pollTaskCompletion')
    pollSpy.mockImplementation(() => Promise.resolve({ success: true, outputUrl: 'https://test.com/result.jpg' }))

    await provider.enhanceImage(request, 'skin-editor')

    // Verify expectedNodeIds
    expect(pollSpy).toHaveBeenCalled()
    const callArgs = pollSpy.mock.calls[0]
    if (!callArgs) throw new Error('pollTaskCompletion was not called')
    
    const expectedNodes = callArgs[1] as string[]
    console.log('✅ Expected Output Nodes:', expectedNodes)
    
    if (expectedNodes.includes('215')) {
      throw new Error('❌ Logic Error: Expected Node 215 (Upscaled) is present when Smart Upscale is DISABLED')
    }
    if (!expectedNodes.includes('136')) {
      throw new Error('❌ Logic Error: Expected Node 136 (Standard) is MISSING')
    }
    if (expectedNodes.length !== 1) {
      console.warn('⚠️ Warning: Expected node count is not 1:', expectedNodes)
    }

    // Find the payload log
    const payloadLog = logs.find(l => l.includes('FULL API PAYLOAD'))
    if (!payloadLog) {
      throw new Error('Payload log not found')
    }

    const parts = payloadLog.split('FULL API PAYLOAD:')
    if (parts.length < 2 || !parts[1]) {
      throw new Error('Payload format incorrect')
    }
    const payloadJson = parts[1].trim()
    const payload = JSON.parse(payloadJson)

    // Verify Node 229 settings
    const node229Settings = payload.nodeInfoList.filter((n: any) => n.nodeId === '229')
    console.log('Node 229 Settings count:', node229Settings.length)
    
    const enableFields = node229Settings.filter((n: any) => n.fieldName.startsWith('Enable '))
    console.log('Enable fields count:', enableFields.length)
    
    if (enableFields.length !== 17) {
      console.error('Expected 17 Enable fields, found:', enableFields.length)
      console.error('Found fields:', enableFields.map((f: any) => f.fieldName))
      throw new Error(`Expected 17 Enable fields for Node 229, found ${enableFields.length}`)
    }

    const allFalse = enableFields.every((n: any) => n.fieldValue === 'false')
    if (!allFalse) {
      const nonFalse = enableFields.filter((n: any) => n.fieldValue !== 'false')
      console.error('Some Enable fields are not "false":', nonFalse)
      throw new Error('All Enable fields should be "false"')
    }
    
    console.log('✅ All Node 229 Enable fields are correctly set to "false"')

      // Write full payload to file for user inspection
      const logContent = `
TEST EXECUTION TIMESTAMP: ${new Date().toISOString()}

SCENARIO: Smart Upscale Disabled

PAYLOAD NODE 229 SETTINGS:
${JSON.stringify(node229Settings, null, 2)}

FULL PAYLOAD:
${JSON.stringify(payload, null, 2)}
`
      require('fs').writeFileSync('payload_log.txt', logContent)
    })
  })
