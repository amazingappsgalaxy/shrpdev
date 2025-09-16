#!/usr/bin/env node

/**
 * Payment Setup Testing Script
 * 
 * This script helps validate your Dodo Payments configuration
 * Run this after setting up products in the Dodo Payments dashboard
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const BASE_URL = 'test.dodopayments.com';

const PRODUCT_IDS = {
  basic_monthly: process.env.DODO_BASIC_MONTHLY_PRODUCT_ID,
  creator_monthly: process.env.DODO_CREATOR_MONTHLY_PRODUCT_ID,
  professional_monthly: process.env.DODO_PROFESSIONAL_MONTHLY_PRODUCT_ID,
  enterprise_monthly: process.env.DODO_ENTERPRISE_MONTHLY_PRODUCT_ID,
};

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData ? JSON.parse(responseData) : null
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testProductExists(productId, planName) {
  console.log(`\n🔍 Testing ${planName} product (${productId})...`);
  
  if (!productId) {
    console.log(`❌ Product ID not found in environment variables`);
    return false;
  }

  try {
    const response = await makeRequest(`/products/${productId}`);
    
    if (response.statusCode === 200) {
      console.log(`✅ Product exists and is accessible`);
      console.log(`   Name: ${response.data.name || 'N/A'}`);
      console.log(`   Price: ${response.data.price || 'N/A'}`);
      return true;
    } else if (response.statusCode === 404) {
      console.log(`❌ Product not found (404)`);
      console.log(`   This product ID doesn't exist in your Dodo Payments dashboard`);
      return false;
    } else {
      console.log(`⚠️  Unexpected response: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error testing product: ${error.message}`);
    return false;
  }
}

async function testAPIConnectivity() {
  console.log(`\n🌐 Testing API connectivity...`);
  
  if (!API_KEY) {
    console.log(`❌ DODO_PAYMENTS_API_KEY not found in environment variables`);
    return false;
  }

  try {
    // Test with products list endpoint
    const response = await makeRequest('/products');
    
    if (response.statusCode === 200) {
      console.log(`✅ API connectivity successful (authentication working)`);
      return true;
    } else if (response.statusCode === 401) {
      console.log(`❌ Authentication failed - check your API key`);
      return false;
    } else {
      console.log(`⚠️  Unexpected response: ${response.statusCode}`);
      return true; // Still consider it working if we get a response
    }
  } catch (error) {
    console.log(`❌ API connectivity failed: ${error.message}`);
    return false;
  }
}

async function testLocalCheckoutAPI() {
  console.log(`\n🛒 Testing local checkout API...`);
  
  const http = require('http');
  
  return new Promise((resolve) => {
    const data = JSON.stringify({
      plan: 'basic',
      billingPeriod: 'monthly'
    });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/payments/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Checkout API working correctly`);
          const response = JSON.parse(responseData);
          if (response.checkoutUrl) {
            console.log(`   Checkout URL generated: ${response.checkoutUrl.substring(0, 50)}...`);
          }
          resolve(true);
        } else if (res.statusCode === 500) {
          console.log(`❌ Checkout API returning 500 error`);
          console.log(`   This likely means product IDs are still invalid`);
          resolve(false);
        } else {
          console.log(`⚠️  Checkout API returned: ${res.statusCode}`);
          console.log(`   Response: ${responseData}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Could not connect to local server: ${error.message}`);
      console.log(`   Make sure your development server is running (npm run dev)`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🚀 Dodo Payments Configuration Test');
  console.log('=====================================');
  
  // Test API connectivity first
  const apiWorking = await testAPIConnectivity();
  if (!apiWorking) {
    console.log('\n❌ API connectivity failed. Please check your API key and try again.');
    process.exit(1);
  }

  // Test each product
  let allProductsValid = true;
  for (const [planKey, productId] of Object.entries(PRODUCT_IDS)) {
    const planName = planKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const isValid = await testProductExists(productId, planName);
    if (!isValid) {
      allProductsValid = false;
    }
  }

  // Test local checkout API
  const checkoutWorking = await testLocalCheckoutAPI();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`API Connectivity: ${apiWorking ? '✅' : '❌'}`);
  console.log(`Product IDs Valid: ${allProductsValid ? '✅' : '❌'}`);
  console.log(`Checkout API: ${checkoutWorking ? '✅' : '❌'}`);
  
  if (apiWorking && allProductsValid && checkoutWorking) {
    console.log('\n🎉 All tests passed! Your payment system is ready.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the PAYMENT_SETUP_GUIDE.md for instructions.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProductExists, testAPIConnectivity, testLocalCheckoutAPI };