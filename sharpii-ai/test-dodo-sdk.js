#!/usr/bin/env node

/**
 * Test Dodo Payments SDK directly
 */

require('dotenv').config({ path: '.env.local' });
const DodoPayments = require('dodopayments');

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: 'test_mode'
});

async function testSDK() {
  console.log('🧪 Testing Dodo Payments SDK directly...');
  console.log('API Key:', process.env.DODO_PAYMENTS_API_KEY?.substring(0, 20) + '...');
  console.log('Environment: test_mode');
  
  try {
    console.log('\n📦 Testing products.list()...');
    const products = await client.products.list();
    console.log('✅ Products retrieved:', products);
    
    if (products.items && products.items.length > 0) {
      console.log('\n🔍 Testing specific product retrieval...');
      const firstProduct = products.items[0];
      console.log('First product ID:', firstProduct.product_id);
      
      const product = await client.products.retrieve(firstProduct.product_id);
      console.log('✅ Product retrieved:', product);
      
      // Test the specific product ID from env
      const testProductId = 'pdt_ALjMHf8bJnZD0GRtNnUAY';
      console.log('\n🎯 Testing specific product ID:', testProductId);
      const specificProduct = await client.products.retrieve(testProductId);
      console.log('✅ Specific product retrieved:', specificProduct.name);
      
    } else {
      console.log('⚠️  No products found in account');
    }
    
  } catch (error) {
    console.log('❌ SDK Error:', error.message);
    console.log('Status:', error.status);
    console.log('Headers:', error.headers);
    
    if (error.error) {
      console.log('Error details:', error.error);
    }
  }
}

testSDK().catch(console.error);