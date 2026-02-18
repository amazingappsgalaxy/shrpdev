
import { RunningHubProvider } from '../src/services/ai-providers/runninghub/runninghub-provider';
import { EnhancementRequest, ProviderConfig } from '../src/services/common/types';

// Mock Fetch
const originalFetch = global.fetch;
let fetchCalls: any[] = [];

global.fetch = (async (url: any, options: any) => {
  fetchCalls.push({ url, options });
  
  if (url.includes('/task/openapi/create')) {
    return {
      ok: true,
      json: async () => ({
        code: 0,
        data: { taskId: 'test-task-id' },
        msg: 'Success'
      }),
      text: async () => JSON.stringify({ code: 0 })
    };
  }
  
  if (url.includes('/task/openapi/status')) {
      return {
          ok: true,
          json: async () => ({
              code: 0,
              data: 'SUCCESS'
          })
      }
  }

  if (url.includes('/task/openapi/outputs')) {
      return {
          ok: true,
          json: async () => ({
              code: 0,
              data: [{ nodeId: '123', fileUrl: 'http://test.com/image.png' }]
          })
      }
  }

  return { ok: true, json: async () => ({}) };
}) as any;

async function testSmartUpscaleDisabled() {
  console.log('🧪 Testing Smart Upscale Disabled Logic...');
  
  const config: ProviderConfig = {
    apiKey: 'test-key',
    baseUrl: 'https://www.runninghub.ai'
  };
  
  const provider = new RunningHubProvider(config);
  
  const request: EnhancementRequest = {
    userId: 'test-user',
    imageId: 'test-image',
    imageUrl: 'http://test.com/input.png',
    settings: {
      smartUpscale: false, // EXPLICITLY DISABLED
      upscaleResolution: '4k'
    }
  };
  
  // Clear calls
  fetchCalls = [];
  
  try {
    await provider.enhanceImage(request, 'skin-editor');
    
    // Find the create task call
    const createCall = fetchCalls.find(c => c.url.includes('/task/openapi/create'));
    if (!createCall) {
      console.error('❌ No create task call found');
      return;
    }
    
    const body = JSON.parse(createCall.options.body);
    const nodeInfoList = body.nodeInfoList;
    
    // Check for node 229 with 'false' values
    const node229 = nodeInfoList.filter((n: any) => n.nodeId === '229');
    console.log(`Found ${node229.length} settings for Node 229`);
    
    const disabledFields = node229.filter((n: any) => n.fieldValue === 'false');
    console.log(`Found ${disabledFields.length} disabled fields for Node 229`);
    
    // Check specific critical fields
    const criticalFields = [
      'Enable SeedVR2 Video Upscaler (v2.5.15)',
      'Enable Output Resolution (4k/8k)',
      'Enable SeedVR2 (Down)Load DiT Model'
    ];
    
    let allDisabled = true;
    for (const field of criticalFields) {
      const setting = node229.find((n: any) => n.fieldName === field);
      if (!setting || setting.fieldValue !== 'false') {
        console.error(`❌ Field '${field}' is NOT disabled! Value: ${setting?.fieldValue}`);
        allDisabled = false;
      } else {
        console.log(`✅ Field '${field}' is correctly disabled.`);
      }
    }
    
    if (allDisabled) {
      console.log('✅ All critical Smart Upscale nodes are disabled correctly!');
    } else {
      console.error('❌ Smart Upscale nodes were NOT disabled correctly.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testSmartUpscaleDisabled();
