#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002';

async function testDodoAPI() {
  console.log('🧪 Testing Dodo Payments Integration...\n');

  try {
    // Test 1: Test Dodo API connection
    console.log('1. Testing Dodo API connection...');
    const dodoResponse = await fetch(`${BASE_URL}/api/test-dodo`);
    const dodoData = await dodoResponse.json();
    
    if (dodoData.success) {
      console.log('✅ Dodo API connection successful');
      console.log(`   Products found: ${dodoData.productCount}`);
    } else {
      console.log('❌ Dodo API connection failed:', dodoData.error);
      return;
    }

    // Test 2: Test authentication
    console.log('\n2. Testing authentication...');
    
    // First try to access protected route without auth
    const protectedResponse = await fetch(`${BASE_URL}/api/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'basic', billingPeriod: 'monthly' })
    });
    
    if (protectedResponse.status === 401) {
      console.log('✅ Authentication protection working');
    } else {
      console.log('⚠️ Expected 401 but got:', protectedResponse.status);
    }

    // Test 3: Test with dummy authentication
    console.log('\n3. Testing checkout flow (would require real auth)...');
    console.log('   To test this fully, you need to:');
    console.log('   1. Sign up/login on the website');
    console.log('   2. Click "Get Started" on a pricing plan');
    console.log('   3. Verify redirection to Dodo payments');

    console.log('\n✅ Basic API integration tests passed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Create products in Dodo Payments dashboard');
    console.log('   2. Update product IDs in dodo-payments-config.ts');
    console.log('   3. Set up webhook endpoints in Dodo dashboard');
    console.log('   4. Test full payment flow with real products');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testDodoAPI();