#!/usr/bin/env node

// Plan testing script
const plans = ['basic', 'creator', 'professional', 'enterprise'];
const billingPeriods = ['monthly', 'yearly'];

async function testPlan(plan, billingPeriod) {
  try {
    console.log(`\n🧪 Testing ${plan} plan (${billingPeriod})...`);
    
    const response = await fetch('http://localhost:3003/api/payments/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan, billingPeriod })
    });
    
    const status = response.status;
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${plan} (${billingPeriod}): Success - ${data.checkoutUrl ? 'Checkout URL generated' : 'No checkout URL'}`);
      return true;
    } else {
      console.log(`❌ ${plan} (${billingPeriod}): Error ${status} - ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`💥 ${plan} (${billingPeriod}): Exception - ${error.message}`);
    return false;
  }
}

async function testAllPlans() {
  console.log('🎯 Testing all pricing plans...\n');
  
  let successCount = 0;
  let totalTests = 0;
  
  for (const plan of plans) {
    for (const billingPeriod of billingPeriods) {
      totalTests++;
      const success = await testPlan(plan, billingPeriod);
      if (success) successCount++;
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All plans are working correctly!');
  } else {
    console.log('⚠️ Some plans have issues that need to be fixed.');
  }
}

// Test API connection first
async function testConnection() {
  try {
    const response = await fetch('http://localhost:3003/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ API is responding');
      return true;
    }
  } catch (error) {
    console.log('❌ Cannot connect to API:', error.message);
    return false;
  }
}

// Run tests
(async () => {
  console.log('🚀 Plan Testing Suite');
  console.log('====================');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('Please make sure the server is running on port 3003');
    process.exit(1);
  }
  
  await testAllPlans();
})();