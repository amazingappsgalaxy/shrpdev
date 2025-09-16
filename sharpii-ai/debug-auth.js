// Using built-in fetch (Node.js 18+)

async function testAuth() {
  console.log('Testing authentication flow...');
  
  try {
    // Test signin
    console.log('\n1. Testing signin...');
    const signinResponse = await fetch('http://localhost:3000/app/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log('Signin status:', signinResponse.status);
    console.log('Signin headers:', Object.fromEntries(signinResponse.headers));
    
    const signinData = await signinResponse.json();
    console.log('Signin response:', signinData);
    
    // Extract cookies
    const setCookieHeader = signinResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);
    
    // Test session with cookies
    console.log('\n2. Testing session with cookies...');
    const sessionResponse = await fetch('http://localhost:3000/app/api/auth/session', {
      headers: {
        'Cookie': setCookieHeader || ''
      }
    });
    
    console.log('Session status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('Session response:', sessionData);
    
    // Test session without cookies
    console.log('\n3. Testing session without cookies...');
    const sessionNoAuthResponse = await fetch('http://localhost:3000/app/api/auth/session');
    const sessionNoAuthData = await sessionNoAuthResponse.json();
    console.log('Session without auth response:', sessionNoAuthData);
    
  } catch (error) {
    console.error('Error testing auth:', error);
  }
}

testAuth();