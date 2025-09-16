const fs = require('fs');

async function testRunningHubAPI() {
  const { default: fetch } = await import('node-fetch');
  try {
    console.log('🚀 Testing RunningHub API with debug logging...');
    
    // First get a session by calling the session endpoint
    const sessionResponse = await fetch('http://localhost:3002/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Session response status:', sessionResponse.status);
    
    // Get cookies from the response
    const cookies = sessionResponse.headers.get('set-cookie');
    console.log('🍪 Cookies:', cookies);
    
    // Test payload
    const testPayload = {
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512',
      modelId: 'runninghub-flux-upscaling',
      settings: {
        prompt: 'high quality, detailed, enhanced',
        steps: 10,
        guidance_scale: 3.5,
        enable_myupscaler: true
      },
      userId: 'test-user-debug',
      imageId: 'test-debug-' + Date.now()
    };
    
    console.log('📋 Test payload:', JSON.stringify(testPayload, null, 2));
    
    // Make the API request
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add cookies if we got them
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    
    const response = await fetch('http://localhost:3002/api/enhance-image', {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload)
    });
    
    console.log('📊 API Response status:', response.status);
    console.log('📊 API Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Raw response:', responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''));
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ Parsed response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse response as JSON:', parseError.message);
      return;
    }
    
    if (response.ok) {
      console.log('✅ API request successful!');
      if (responseData.success) {
        console.log('✅ Enhancement process started successfully');
        console.log('📋 Task ID:', responseData.taskId);
        console.log('📋 Job ID:', responseData.jobId);
      } else {
        console.log('⚠️ Enhancement process failed:', responseData.error);
      }
    } else {
      console.log('❌ API request failed with status:', response.status);
      console.log('❌ Error details:', responseData);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('❌ Error stack:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting RunningHub Debug Test\n');
testRunningHubAPI().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(console.error);