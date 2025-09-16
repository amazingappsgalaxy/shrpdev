import fetch from 'node-fetch';

// Simple test to isolate the RunningHub API issue
async function testRunningHubSimple() {
  console.log('🔍 Testing RunningHub API with Simple Image URL');
  console.log('============================================================');
  
  const API_KEY = '95d3c787224840998c28fd0f2da9b4a2';
  const WORKFLOW_ID = '1965053107388432385';
  const BASE_URL = 'https://www.runninghub.ai';
  
  // Use a simple, reliable test image URL that supports HEAD requests
  const testImageUrl = 'https://httpbin.org/image/png';
  
  console.log('📋 Test Configuration:');
  console.log('  - API Key:', API_KEY.substring(0, 8) + '...');
  console.log('  - Workflow ID:', WORKFLOW_ID);
  console.log('  - Test Image URL:', testImageUrl);
  
  try {
    // Step 1: Verify the test image is accessible
    console.log('\n📋 Step 1: Verifying test image accessibility...');
    const imageResponse = await fetch(testImageUrl, { method: 'HEAD' });
    console.log('✅ Test image accessible:', imageResponse.status, imageResponse.statusText);
    console.log('  - Content-Type:', imageResponse.headers.get('content-type'));
    console.log('  - Content-Length:', imageResponse.headers.get('content-length'));
    
    // Step 2: Create RunningHub task with the test image
    console.log('\n📋 Step 2: Creating RunningHub task...');
    
    const nodeInfoList = [
      {
        nodeId: '97', // LoadImage node
        fieldName: 'image',
        fieldValue: testImageUrl
      },
      {
        nodeId: '86', // CLIPTextEncode node for prompt
        fieldName: 'text',
        fieldValue: 'enhance this image with high quality details'
      },
      {
        nodeId: '89', // RandomNoise node for seed
        fieldName: 'noise_seed',
        fieldValue: '12345'
      },
      {
        nodeId: '90', // BasicScheduler node for steps
        fieldName: 'steps',
        fieldValue: '10'
      },
      {
        nodeId: '88', // FluxGuidance node for guidance scale
        fieldName: 'guidance',
        fieldValue: '3.5'
      },
      {
        nodeId: '90', // BasicScheduler node for denoise strength
        fieldName: 'denoise',
        fieldValue: '0.3'
      },
      {
        nodeId: '87', // KSamplerSelect node for sampler
        fieldName: 'sampler_name',
        fieldValue: 'dpmpp_2m'
      },
      {
        nodeId: '90', // BasicScheduler node for scheduler
        fieldName: 'scheduler',
        fieldValue: 'sgm_uniform'
      }
    ];
    
    const taskPayload = {
      workflowId: WORKFLOW_ID,
      nodeInfoList: nodeInfoList
    };
    
    console.log('📊 Task payload:');
    console.log('  - Workflow ID:', taskPayload.workflowId);
    console.log('  - Node count:', taskPayload.nodeInfoList.length);
    console.log('  - Image node (97):', nodeInfoList.find(n => n.nodeId === '97')?.fieldValue);
    console.log('  - Prompt node (86):', nodeInfoList.find(n => n.nodeId === '86')?.fieldValue);
    
    const createResponse = await fetch(`${BASE_URL}/task/openapi/create`, {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.ai',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        workflowId: WORKFLOW_ID,
        nodeInfoList,
        addMetadata: true
      })
    });
    
    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.log('❌ Task creation failed:', createResponse.status, createResponse.statusText);
      console.log('📊 Error details:', JSON.stringify(createResult, null, 2));
      return;
    }
    
    console.log('✅ Task created successfully!');
    console.log('📊 Full create response:', JSON.stringify(createResult, null, 2));
    console.log('📊 Task details:');
    console.log('  - Task ID:', createResult.data?.taskId);
    console.log('  - Status:', createResult.data?.status);
    
    const taskId = createResult.data?.taskId;
    if (!taskId) {
      console.log('❌ No task ID returned');
      return;
    }
    
    // Step 3: Poll for task completion
    console.log('\n📋 Step 3: Polling for task completion...');
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
      attempts++;
      
      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}...`);
      
      const statusResponse = await fetch(`${BASE_URL}/task/openapi/status`, {
        method: 'POST',
        headers: {
          'Host': 'www.runninghub.ai',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: API_KEY,
          taskId
        })
      });
      
      const statusResult = await statusResponse.json();
      
      if (!statusResponse.ok) {
        console.log('❌ Status check failed:', statusResponse.status, statusResponse.statusText);
        console.log('📊 Error details:', JSON.stringify(statusResult, null, 2));
        break;
      }
      
      const status = statusResult.data; // Status is directly in data field
      console.log('📊 Current status:', status);
      
      if (status === 'SUCCESS') {
        console.log('✅ Task completed successfully!');
        
        // Get detailed outputs
        console.log('\n📋 Step 4: Fetching detailed outputs...');
        const outputResponse = await fetch(`${BASE_URL}/task/openapi/outputs`, {
          method: 'POST',
          headers: {
            'Host': 'www.runninghub.ai',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: API_KEY,
            taskId
          })
        });
        
        const outputData = await outputResponse.json();
        console.log('📊 Full output response:', JSON.stringify(outputData, null, 2));
        
        if (outputData.code === 0 && outputData.data && outputData.data.length > 0) {
          console.log('🎉 SUCCESS! Found', outputData.data.length, 'output files:');
          
          // Test each output
          for (let i = 0; i < outputData.data.length; i++) {
            const output = outputData.data[i];
            console.log(`\n📋 Output ${i + 1}:`);
            console.log('  - Node ID:', output.nodeId);
            console.log('  - File URL:', output.fileUrl);
            
            if (output.fileUrl) {
              try {
                const testResponse = await fetch(output.fileUrl, { method: 'HEAD' });
                console.log('  - Status:', testResponse.status, testResponse.statusText);
                console.log('  - Content-Type:', testResponse.headers.get('content-type'));
                console.log('  - Content-Length:', testResponse.headers.get('content-length'));
                
                if (testResponse.ok && testResponse.headers.get('content-type')?.includes('image')) {
                  console.log('  ✅ VALID IMAGE OUTPUT!');
                  console.log('  🖼️  View image at:', output.fileUrl);
                }
              } catch (error) {
                console.log('  ❌ Output not accessible:', error.message);
              }
            }
          }
        } else {
          console.log('❌ No outputs found or invalid response');
        }
        
        break;
      } else if (status === 'FAILED') {
        console.log('❌ Task failed!');
        console.log('📊 Full response:', JSON.stringify(statusResult, null, 2));
        break;
      } else if (status === 'RUNNING' || status === 'PENDING') {
        console.log('⏳ Task still processing...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      } else {
        console.log('❓ Unknown status:', status);
        console.log('📊 Full response:', JSON.stringify(statusResult, null, 2));
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Polling timeout reached');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📊 Error details:', error);
  }
}

// Run the test
testRunningHubSimple().catch(console.error);