#!/usr/bin/env node
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3003'

async function testCreditsAPI() {
  console.log('🧪 Testing Credits API Endpoints\n')

  try {
    // Test credits balance endpoint
    console.log('📊 Testing /api/credits/balance...')
    const balanceResponse = await fetch(`${BASE_URL}/api/credits/balance`, {
      credentials: 'include',
      headers: {
        'Cookie': 'session=your-session-cookie-here' // Replace with actual session
      }
    })

    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json()
      console.log('✅ Balance API Response:', JSON.stringify(balanceData, null, 2))
    } else {
      console.log('❌ Balance API Error:', balanceResponse.status, balanceResponse.statusText)
    }

    console.log('')

    // Test credits history endpoint
    console.log('📚 Testing /api/credits/history...')
    const historyResponse = await fetch(`${BASE_URL}/api/credits/history?limit=10`, {
      credentials: 'include',
      headers: {
        'Cookie': 'session=your-session-cookie-here' // Replace with actual session
      }
    })

    if (historyResponse.ok) {
      const historyData = await historyResponse.json()
      console.log('✅ History API Response:', JSON.stringify(historyData, null, 2))
    } else {
      console.log('❌ History API Error:', historyResponse.status, historyResponse.statusText)
    }

  } catch (error) {
    console.error('🚨 API Test Error:', error.message)
    console.log('\n💡 Make sure:')
    console.log('1. The development server is running on port 3003')
    console.log('2. You have a valid session cookie')
    console.log('3. You are logged in to the application')
  }

  console.log('\n✨ API test completed!')
}

testCreditsAPI()