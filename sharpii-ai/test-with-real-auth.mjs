import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:3002';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

async function testWithRealAuth() {
  console.log('🚀 Testing RunningHub API with Real Authentication');
  console.log('=' .repeat(60));
  
  let sessionToken = null;
  
  try {
    // Step 1: Register or login to get a session
    console.log('\n📋 Step 1: Attempting to sign up...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER)
    });
    
    if (signupResponse.ok) {
      console.log('✅ Sign up successful');
    } else {
      console.log('ℹ️  Sign up failed (user might already exist), trying sign in...');
    }
    
    // Step 2: Sign in to get session token
    console.log('\n📋 Step 2: Signing in...');
    const signinResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    
    if (!signinResponse.ok) {
      const errorText = await signinResponse.text();
      throw new Error(`Sign in failed: ${signinResponse.status} ${errorText}`);
    }
    
    // Extract session token from Set-Cookie header
    const setCookieHeader = signinResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      const sessionMatch = setCookieHeader.match(/session=([^;]+)/);
      if (sessionMatch) {
        sessionToken = sessionMatch[1];
        console.log('✅ Session token obtained:', sessionToken.substring(0, 20) + '...');
      }
    }
    
    if (!sessionToken) {
      throw new Error('Failed to extract session token from response');
    }
    
    // Step 3: Verify session
    console.log('\n📋 Step 3: Verifying session...');
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': `session=${sessionToken}`
      }
    });
    
    if (!sessionResponse.ok) {
      throw new Error(`Session verification failed: ${sessionResponse.status}`);
    }
    
    const sessionData = await sessionResponse.json();
    console.log('✅ Session verified for user:', sessionData.user?.email);
    
    // Step 4: Test enhancement API with proper authentication
    console.log('\n📋 Step 4: Testing enhancement API...');
    const enhancementPayload = {
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512',
      modelId: 'runninghub-flux-upscaling',
      settings: {
        prompt: 'high quality, detailed, enhanced',
        steps: 10,
        guidance_scale: 3.5,
        enable_myupscaler: true
      },
      userId: sessionData.user.id,
      imageId: `test-auth-${Date.now()}`
    };
    
    console.log('📊 Sending enhancement request with payload:', {
      ...enhancementPayload,
      imageUrl: enhancementPayload.imageUrl.substring(0, 50) + '...'
    });
    
    const enhanceResponse = await fetch(`${BASE_URL}/api/enhance-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      },
      body: JSON.stringify(enhancementPayload)
    });
    
    console.log('📊 Enhancement API Response Status:', enhanceResponse.status);
    console.log('📊 Enhancement API Response Headers:', Object.fromEntries(enhanceResponse.headers.entries()));
    
    const responseText = await enhanceResponse.text();
    console.log('📊 Enhancement API Raw Response:', responseText);
    
    if (enhanceResponse.ok) {
      try {
        const enhanceData = JSON.parse(responseText);
        console.log('✅ Enhancement API Success:', enhanceData);
      } catch (e) {
        console.log('✅ Enhancement API Success (non-JSON response):', responseText);
      }
    } else {
      console.log('❌ Enhancement API Failed:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testWithRealAuth();