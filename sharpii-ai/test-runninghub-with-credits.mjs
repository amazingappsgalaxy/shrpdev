import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const ADMIN_SECRET = 'sharpii_admin_secret_2024';

async function testRunningHubWithCredits() {
  try {
    console.log('🚀 Testing RunningHub API with Credits');
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
    const userId = demoData.user.id;
    
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
    
    // Step 2: Grant credits to user
    console.log('\n📋 Step 2: Granting credits to user...');
    const creditResponse = await fetch(`${BASE_URL}/api/test/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify({
        action: 'grant_monthly',
        plan: 'basic'
      })
    });
    
    if (!creditResponse.ok) {
      const errorText = await creditResponse.text();
      console.log('⚠️  Credit grant failed:', creditResponse.status, errorText);
      // Try alternative admin endpoint
      console.log('\n📋 Step 2b: Trying admin credit grant...');
      const adminCreditResponse = await fetch(`${BASE_URL}/api/admin/grant-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET}`
        },
        body: JSON.stringify({
          userId: userId,
          amount: 1000,
          reason: 'testing RunningHub API'
        })
      });
      
      if (!adminCreditResponse.ok) {
        const adminErrorText = await adminCreditResponse.text();
        console.log('❌ Admin credit grant also failed:', adminCreditResponse.status, adminErrorText);
      } else {
        const adminCreditData = await adminCreditResponse.json();
        console.log('✅ Admin credits granted:', adminCreditData);
      }
    } else {
      const creditData = await creditResponse.json();
      console.log('✅ Credits granted:', creditData);
    }
    
    // Step 3: Check credit balance
    console.log('\n📋 Step 3: Checking credit balance...');
    const balanceResponse = await fetch(`${BASE_URL}/api/test/credits`, {
      method: 'GET',
      headers: {
        'Cookie': `session=${sessionToken}`
      }
    });
    
    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      console.log('⚠️  Balance check failed:', balanceResponse.status, errorText);
    } else {
      const balanceData = await balanceResponse.json();
      console.log('✅ Current balance:', balanceData);
    }
    
    // Step 4: Test RunningHub API specifically
    console.log('\n📋 Step 4: Testing RunningHub API...');
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
          prompt: 'enhance this image with RunningHub',
          enable_myupscaler: true,
          steps: 20,
          guidance_scale: 7.5
        },
        imageId: `test-runninghub-${Date.now()}`
      })
    });
    
    console.log('📊 RunningHub API Response Status:', enhanceResponse.status);
    
    if (!enhanceResponse.ok) {
      const errorText = await enhanceResponse.text();
      console.log('❌ RunningHub API failed:', errorText);
    } else {
      const enhanceData = await enhanceResponse.json();
      console.log('✅ RunningHub API success:', JSON.stringify(enhanceData, null, 2));
      
      if (enhanceData.success && enhanceData.taskId) {
        console.log('🎉 RunningHub task created successfully!');
        console.log('📋 Task ID:', enhanceData.taskId);
        console.log('📋 Job ID:', enhanceData.jobId);
        console.log('\n⏳ Task is now processing... Check server logs for detailed RunningHub polling information.');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRunningHubWithCredits().then(() => {
  console.log('\n🏁 Test completed!');
});