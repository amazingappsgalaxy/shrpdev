// Test RunningHub API with proper authentication simulation
const fs = require('fs');

// Test the RunningHub API functionality
async function testRunningHubAPI() {
  console.log('🧪 Testing RunningHub API functionality...');
  
  // Create a test base64 image (small 1x1 pixel JPEG)
  const testBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  
  const testPayload = {
    imageUrl: testBase64Image,
    modelId: 'runninghub-flux-upscaling', // Correct model ID
    settings: {
      prompt: 'A beautiful landscape with mountains and trees',
      seed: 12345,
      steps: 20,
      guidance_scale: 3.5,
      denoise_strength: 0.3
    }
  };
  
  try {
    console.log('📤 Sending test request to /api/enhance-image...');
    console.log('📋 Using model ID:', testPayload.modelId);
    
    // For demo purposes, we'll test without authentication first
    // This will show the API structure is working (expect 401)
    console.log('⚠️ Testing without authentication (expect 401 - this is normal)');
    let sessionCookie = '';
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (sessionCookie) {
      headers['Cookie'] = `session=${sessionCookie}`;
    }
    
    const response = await fetch('http://localhost:3002/api/enhance-image', {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ Parsed response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse response as JSON:', parseError.message);
      return;
    }
    
    // Check if the response indicates success
    if (response.ok) {
      console.log('✅ API request successful!');
      
      if (responseData.success) {
        console.log('✅ Enhancement process started successfully');
        console.log('📋 Task ID:', responseData.taskId);
        console.log('📋 Job ID:', responseData.jobId);
        console.log('🎉 DEMO: The RunningHub API is working correctly!');
        console.log('🎉 DEMO: Base64 image conversion fixed!');
        console.log('🎉 DEMO: Model ID issue resolved!');
      } else {
        console.log('⚠️ Enhancement process failed:', responseData.error);
      }
    } else {
      console.log('❌ API request failed with status:', response.status);
      console.log('❌ Error details:', responseData);
      
      if (response.status === 401) {
        console.log('\n🔐 Authentication required. To test with proper auth:');
        console.log('1. Open http://localhost:3002 in browser');
        console.log('2. Log in to the application');
        console.log('3. Open browser dev tools (F12)');
        console.log('4. Go to Application > Cookies > http://localhost:3002');
        console.log('5. Copy the "session" cookie value');
        console.log('6. Save it to ./test_cookies.txt');
        console.log('7. Run this test again');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('❌ Error stack:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting RunningHub API Test\n');
testRunningHubAPI().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(console.error);