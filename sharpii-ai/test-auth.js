// Simple test script to check if Better Auth is working
const { auth } = require('./src/lib/auth.ts')

async function testAuth() {
  try {
    console.log('Testing Better Auth configuration...')
    console.log('Auth object:', typeof auth)
    console.log('Auth methods:', Object.keys(auth))
    
    // Try to access the handler
    if (auth.handler) {
      console.log('Auth handler exists')
    } else {
      console.log('No auth handler found')
    }
    
  } catch (error) {
    console.error('Auth test failed:', error)
  }
}

testAuth()