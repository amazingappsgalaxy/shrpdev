import fetch from 'node-fetch';

const BASE_URL = 'https://www.runninghub.ai';
const WORKFLOW_ID = '1965053107388432385';
const API_KEY = '95d3c787224840998c28fd0f2da9b4a2';

// Use a valid test image URL instead of base64
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512&h=512&fit=crop';

async function testRunningHubOutputs() {
  console.log('🔍 Testing RunningHub Output Nodes');
  console.log('============================================================');
  console.log('📋 Workflow ID:', WORKFLOW_ID);
  console.log('📋 API Key:', API_KEY.substring(0, 10) + '...');
  console.log('📋 Test Image URL:', TEST_IMAGE_URL);
  
  try {
    // Create a task with a valid image URL
    console.log('\n📋 Step 1: Creating task with valid image URL...');
    const createResponse = await fetch(`${BASE_URL}/task/openapi/create`, {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.ai',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        workflowId: WORKFLOW_ID,
        nodeInfoList: [
          {
            nodeId: '97',
            fieldName: 'image',
            fieldValue: TEST_IMAGE_URL
          },
          {
            nodeId: '86',
            fieldName: 'text',
            fieldValue: 'enhance this beautiful landscape image'
          },
          {
            nodeId: '89',
            fieldName: 'noise_seed',
            fieldValue: '12345'
          },
          {
            nodeId: '89',
            fieldName: 'steps',
            fieldValue: '10'
          },
          {
            nodeId: '89',
            fieldName: 'cfg',
            fieldValue: '3.5'
          },
          {
            nodeId: '89',
            fieldName: 'denoise',
            fieldValue: '0.3'
          },
          {
            nodeId: '89',
            fieldName: 'sampler_name',
            fieldValue: 'euler'
          },
          {
            nodeId: '89',
            fieldName: 'scheduler',
            fieldValue: 'normal'
          }
        ],
        addMetadata: true
      })
    });
    
    const createData = await createResponse.json();
    console.log('📊 Task creation response:', JSON.stringify(createData, null, 2));
    
    if (createData.code !== 0) {
      console.log('❌ Failed to create task. Error details:');
      if (createData.msg) {
        try {
          const errorDetails = JSON.parse(createData.msg);
          console.log('🔍 Error analysis:', JSON.stringify(errorDetails, null, 2));
          
          if (errorDetails.node_errors) {
            console.log('\n🚨 Node-specific errors:');
            Object.entries(errorDetails.node_errors).forEach(([nodeId, error]) => {
              console.log(`  Node ${nodeId}:`, error);
            });
          }
        } catch (e) {
          console.log('Raw error message:', createData.msg);
        }
      }
      return;
    }
    
    const taskId = createData.data.taskId;
    console.log('✅ Task created with ID:', taskId);
    
    // Check promptTips for workflow insights
    if (createData.data.promptTips) {
      try {
        const promptTips = JSON.parse(createData.data.promptTips);
        console.log('🔍 Workflow insights:', JSON.stringify(promptTips, null, 2));
        
        if (promptTips.outputs_to_execute) {
          console.log('📋 Expected output nodes:', promptTips.outputs_to_execute);
        }
      } catch (e) {
        console.log('🔍 Raw promptTips:', createData.data.promptTips);
      }
    }
    
    // Wait for task completion
    console.log('\n📋 Step 2: Waiting for task completion...');
    let attempts = 0;
    const maxAttempts = 40; // Increased timeout
    const pollInterval = 5000; // 5 seconds
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
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
      
      const statusData = await statusResponse.json();
      console.log(`⏳ Attempt ${attempts + 1}: Status =`, statusData.data);
      
      if (statusData.code === 0) {
        const status = statusData.data;
        
        if (status === 'SUCCESS') {
          console.log('✅ Task completed successfully!');
          break;
        } else if (status === 'FAILED') {
          console.log('❌ Task failed on RunningHub');
          return;
        }
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Task timed out');
      return;
    }
    
    // Get task outputs
    console.log('\n📋 Step 3: Fetching task outputs...');
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
    
    if (outputData.code === 0) {
      if (outputData.data && outputData.data.length > 0) {
        console.log('\n🎯 Available Output Nodes:');
        outputData.data.forEach((output, index) => {
          console.log(`  ${index + 1}. Node ID: ${output.nodeId}`);
          console.log(`     - Has fileUrl: ${!!output.fileUrl}`);
          console.log(`     - File URL: ${output.fileUrl || 'N/A'}`);
          if (output.fileUrl) {
            console.log(`     - URL Preview: ${output.fileUrl.substring(0, 100)}...`);
          }
          console.log('');
        });
        
        // Check for specific nodes we're looking for
        const expectedNodes = ['144', '102', '138', '136', '143'];
        console.log('🔍 Checking for expected output nodes:');
        expectedNodes.forEach(nodeId => {
          const node = outputData.data.find(o => o.nodeId === nodeId);
          console.log(`  - Node ${nodeId}: ${node ? '✅ Found' : '❌ Not found'}`);
          if (node && node.fileUrl) {
            console.log(`    URL: ${node.fileUrl}`);
          }
        });
        
        // Find the best output node
        const outputWithUrl = outputData.data.find(o => o.fileUrl);
        if (outputWithUrl) {
          console.log(`\n🎉 Best output found: Node ${outputWithUrl.nodeId}`);
          console.log(`   URL: ${outputWithUrl.fileUrl}`);
          
          // Test if the URL is accessible
          try {
            const testResponse = await fetch(outputWithUrl.fileUrl, { method: 'HEAD' });
            console.log(`   URL Status: ${testResponse.status} ${testResponse.statusText}`);
          } catch (e) {
            console.log(`   URL Test Failed: ${e.message}`);
          }
        } else {
          console.log('\n❌ No outputs with valid URLs found');
        }
        
      } else {
        console.log('❌ No output data received (empty array)');
        console.log('🔍 This suggests the workflow completed but produced no outputs');
        console.log('💡 Possible causes:');
        console.log('   - Output nodes are not configured to save files');
        console.log('   - Workflow has no SaveImage nodes');
        console.log('   - Output nodes failed during execution');
        console.log('   - Workflow configuration issue');
      }
    } else {
      console.log('❌ Failed to fetch outputs:', outputData.msg);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('❌ Error stack:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting RunningHub Output Test\n');
testRunningHubOutputs().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(console.error);