import fetch from 'node-fetch';

const BASE_URL = 'https://www.runninghub.ai';
const WORKFLOW_ID = '1965053107388432385';
const API_KEY = process.env.RUNNINGHUB_API_KEY || 'your-api-key-here';

async function testWorkflowValidation() {
  console.log('🔍 Testing RunningHub Workflow Validation');
  console.log('============================================================');
  console.log('📋 Workflow ID:', WORKFLOW_ID);
  console.log('📋 API Key:', API_KEY.substring(0, 10) + '...');
  
  try {
    // Test 1: Empty nodeInfoList to check workflow existence
    console.log('\n📋 Test 1: Checking workflow existence with empty nodeInfoList...');
    const emptyResponse = await fetch(`${BASE_URL}/task/openapi/create`, {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.ai',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        workflowId: WORKFLOW_ID,
        nodeInfoList: [],
        addMetadata: true
      })
    });
    
    const emptyData = await emptyResponse.json();
    console.log('📊 Empty nodeInfoList response:', JSON.stringify(emptyData, null, 2));
    
    // Analyze the response
    if (emptyData.code === 0) {
      console.log('✅ Workflow exists and is accessible');
    } else if (emptyData.code === 380) {
      console.log('❌ Error 380: Workflow does not exist');
      return;
    } else if (emptyData.code === 801) {
      console.log('❌ Error 801: Free users not allowed to use API Keys');
      return;
    } else if (emptyData.code === 802) {
      console.log('❌ Error 802: API Key unauthorized or expired');
      return;
    } else {
      console.log('⚠️ Unexpected response code:', emptyData.code);
      console.log('⚠️ Message:', emptyData.msg);
    }
    
    // Test 2: Test with minimal nodeInfoList
    console.log('\n📋 Test 2: Testing with minimal nodeInfoList...');
    const minimalNodeList = [
      {
        nodeId: '1', // Try a common node ID
        fieldName: 'text',
        fieldValue: 'test prompt'
      }
    ];
    
    const minimalResponse = await fetch(`${BASE_URL}/task/openapi/create`, {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.ai',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        workflowId: WORKFLOW_ID,
        nodeInfoList: minimalNodeList,
        addMetadata: true
      })
    });
    
    const minimalData = await minimalResponse.json();
    console.log('📊 Minimal nodeInfoList response:', JSON.stringify(minimalData, null, 2));
    
    // Analyze the response
    if (minimalData.code === 0) {
      console.log('✅ Task created successfully with minimal nodeInfoList');
      console.log('📋 Task ID:', minimalData.data?.taskId);
      
      // Test the task status
      if (minimalData.data?.taskId) {
        console.log('\n📋 Test 3: Checking task status...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const statusResponse = await fetch(`${BASE_URL}/task/openapi/status`, {
          method: 'POST',
          headers: {
            'Host': 'www.runninghub.ai',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: API_KEY,
            taskId: minimalData.data.taskId
          })
        });
        
        const statusData = await statusResponse.json();
        console.log('📊 Task status response:', JSON.stringify(statusData, null, 2));
      }
    } else if (minimalData.code === 433) {
      console.log('❌ Error 433: Workflow validation failed');
      console.log('📋 This means the workflow exists but our node configuration is wrong');
      console.log('📋 Message:', minimalData.msg);
    } else if (minimalData.code === 803) {
      console.log('❌ Error 803: nodeInfoList does not match workflow');
      console.log('📋 Node ID "1" does not exist in this workflow');
      console.log('📋 Message:', minimalData.msg);
    } else {
      console.log('⚠️ Unexpected response code:', minimalData.code);
      console.log('⚠️ Message:', minimalData.msg);
    }
    
    // Test 3: Test with our current node mappings
    console.log('\n📋 Test 4: Testing with our current node mappings...');
    const currentNodeList = [
      {
        nodeId: '97', // LoadImage node
        fieldName: 'image',
        fieldValue: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512'
      },
      {
        nodeId: '86', // CLIPTextEncode node
        fieldName: 'text',
        fieldValue: 'high quality, detailed, enhanced'
      },
      {
        nodeId: '89', // RandomNoise node
        fieldName: 'noise_seed',
        fieldValue: '12345'
      }
    ];
    
    const currentResponse = await fetch(`${BASE_URL}/task/openapi/create`, {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.ai',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        workflowId: WORKFLOW_ID,
        nodeInfoList: currentNodeList,
        addMetadata: true
      })
    });
    
    const currentData = await currentResponse.json();
    console.log('📊 Current nodeInfoList response:', JSON.stringify(currentData, null, 2));
    
    // Analyze the response
    if (currentData.code === 0) {
      console.log('✅ Task created successfully with current node mappings');
      console.log('📋 Task ID:', currentData.data?.taskId);
      console.log('🎉 Our node mappings are correct!');
    } else if (currentData.code === 433) {
      console.log('❌ Error 433: Workflow validation failed with current mappings');
      console.log('📋 Some of our node IDs or field names are incorrect');
      console.log('📋 Message:', currentData.msg);
    } else if (currentData.code === 803) {
      console.log('❌ Error 803: Current nodeInfoList does not match workflow');
      console.log('📋 One or more of our node IDs (97, 86, 89) do not exist');
      console.log('📋 Message:', currentData.msg);
    } else {
      console.log('⚠️ Unexpected response code:', currentData.code);
      console.log('⚠️ Message:', currentData.msg);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Instructions for getting API key
if (API_KEY === 'your-api-key-here') {
  console.log('⚠️  Please set your RunningHub API key:');
  console.log('1. Get your API key from RunningHub dashboard');
  console.log('2. Run: export RUNNINGHUB_API_KEY="your-actual-api-key"');
  console.log('3. Then run this script again');
  process.exit(1);
}

// Run the test
console.log('🚀 Starting RunningHub Workflow Validation Test\n');
testWorkflowValidation().then(() => {
  console.log('\n🏁 Test completed!');
});