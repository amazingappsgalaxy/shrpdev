import { NextRequest, NextResponse } from 'next/server'
import { EnhancementService } from '../../../services/ai-providers'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test RunningHub: Starting test...')

    // Get the enhancement service
    const enhancementService = EnhancementService.getInstance()

    // Check provider status
    const providerStatus = enhancementService.getProviderStatus()
    console.log('🔍 Provider status:', providerStatus)

    // Get available models
    const models = enhancementService.getAvailableModels()
    console.log('🔍 Available models:', models.length)

    // Find RunningHub FLUX model
    const runningHubModel = models.find(m => m.id.includes('flux-upscaling'))
    console.log('🔍 RunningHub FLUX model:', runningHubModel ? 'Found' : 'Not found')

    const body = await request.json()
    const { imageUrl, settings } = body

    if (!imageUrl) {
      return NextResponse.json({
        error: 'imageUrl is required',
        providerStatus,
        modelsCount: models.length,
        hasFluxModel: !!runningHubModel
      }, { status: 400 })
    }

    // Create test enhancement request
    const testRequest = {
      imageUrl,
      settings: settings || {
        prompt: 'high quality, detailed, enhanced',
        steps: 10,
        guidance_scale: 3.5,
        denoise: 0.3
      },
      userId: 'test-user-123',
      imageId: `test-${Date.now()}`
    }

    console.log('🧪 Test RunningHub: Making enhancement request...')

    // Try enhancing with RunningHub FLUX model
    const result = await enhancementService.enhanceImage(
      testRequest,
      'runninghub-flux-upscaling'
    )

    console.log('✅ Test RunningHub: Enhancement result:', {
      success: result.success,
      hasUrl: !!result.enhancedUrl,
      error: result.error,
      message: result.message
    })

    return NextResponse.json({
      result,
      testInfo: {
        providerStatus,
        modelsCount: models.length,
        hasFluxModel: !!runningHubModel,
        testRequest: {
          imageUrl: testRequest.imageUrl.substring(0, 50) + '...',
          userId: testRequest.userId,
          imageId: testRequest.imageId
        }
      }
    })

  } catch (error) {
    console.error('❌ Test RunningHub: Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const enhancementService = EnhancementService.getInstance()
    const providerStatus = enhancementService.getProviderStatus()
    const models = enhancementService.getAvailableModels()

    return NextResponse.json({
      message: 'RunningHub Test Endpoint',
      providerStatus,
      models: models.filter(m => m.provider.name === 'runninghub'),
      config: {
        hasApiKey: !!process.env.RUNNINGHUB_API_KEY,
        baseUrl: process.env.RUNNINGHUB_BASE_URL || 'https://www.runninghub.ai'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}