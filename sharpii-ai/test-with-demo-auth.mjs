import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';
const TEST_EMAIL = `test-${Date.now()}@example.com`;

async function testWithDemoAuth() {
  try {
    console.log('🚀 Testing RunningHub API with Demo Authentication');
    console.log('============================================================');
    
    // Step 1: Create demo account
    console.log('\n📋 Step 1: Creating demo account...');
    const demoResponse = await fetch(`${BASE_URL}/api/demo/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });
    
    if (!demoResponse.ok) {
      const errorText = await demoResponse.text();
      throw new Error(`Demo account creation failed: ${demoResponse.status} ${errorText}`);
    }
    
    const demoData = await demoResponse.json();
    console.log('✅ Demo account created:', demoData.user.email);
    
    // Extract session cookie from response headers
    const setCookieHeader = demoResponse.headers.get('set-cookie');
    let sessionToken = null;
    if (setCookieHeader) {
      const sessionMatch = setCookieHeader.match(/session=([^;]+)/);
      if (sessionMatch) {
        sessionToken = sessionMatch[1];
        console.log('✅ Session token extracted from cookie');
      }
    }
    
    if (!sessionToken) {
      throw new Error('No session token found in response');
    }
    
    // Step 2: Verify session works
    console.log('\n📋 Step 2: Verifying session...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': `session=${sessionToken}`
      }
    });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.log('⚠️  Session verification failed:', sessionResponse.status, errorText);
    } else {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session verified for user:', sessionData.user?.email || 'unknown');
    }
    
    // Step 3: Test enhance-image API
    console.log('\n📋 Step 3: Testing enhance-image API...');
    const enhanceResponse = await fetch(`${BASE_URL}/api/enhance-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify({
        imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
        modelId: 'runninghub-flux-upscaling',
        settings: {
          prompt: 'enhance this image',
          enable_myupscaler: true,
          steps: 20,
          guidance_scale: 7.5
        },
        imageId: `test-image-${Date.now()}`
      })
    });
    
    console.log('📊 Enhance API Response Status:', enhanceResponse.status);
    
    if (!enhanceResponse.ok) {
      const errorText = await enhanceResponse.text();
      console.log('❌ Enhance API failed:', errorText);
    } else {
      const enhanceData = await enhanceResponse.json();
      console.log('✅ Enhance API success:', JSON.stringify(enhanceData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testWithDemoAuth().then(() => {
  console.log('\n🏁 Test completed!');
});