#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test user ID - using the logged-in user from the server logs
const TEST_USER_ID = 'e5ed252b-5877-40b6-bbac-ab54b465917c' // Real user ID from logs

async function testSubscriptionCredits() {
  console.log('🔄 Adding subscription credits...')

  // Add monthly creator plan credits (expire in 30 days)
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  const { data, error } = await supabase
    .from('credits')
    .insert({
      user_id: TEST_USER_ID,
      amount: 2500,
      type: 'subscription',
      source: 'subscription_renewal',
      expires_at: expiresAt.toISOString(),
      is_active: true,
      metadata: JSON.stringify({
        plan: 'Creator',
        type: 'subscription_credits',
        expires_monthly: true
      }),
      transaction_id: `test_sub_${Date.now()}`
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding subscription credits:', error)
  } else {
    console.log('✅ Added 2,500 Creator Plan credits (expires:', expiresAt.toLocaleDateString(), ')')
  }
}

async function testPermanentCredits() {
  console.log('🔄 Adding permanent credits...')

  const { data, error } = await supabase
    .from('credits')
    .insert({
      user_id: TEST_USER_ID,
      amount: 1000,
      type: 'purchase',
      source: 'credit_purchase',
      expires_at: '9999-12-31T23:59:59.999Z', // No expiry
      is_active: true,
      metadata: JSON.stringify({
        package_type: 'premium',
        type: 'permanent_credits',
        expires_monthly: false
      }),
      transaction_id: `test_purchase_${Date.now()}`
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding permanent credits:', error)
  } else {
    console.log('✅ Added 1,000 permanent credits (no expiry)')
  }
}

async function testCreditDeduction() {
  console.log('🔄 Adding credit deduction...')

  const { data, error } = await supabase
    .from('credits')
    .insert({
      user_id: TEST_USER_ID,
      amount: -50,
      type: 'deduction',
      source: 'image_enhancement',
      expires_at: '9999-12-31T23:59:59.999Z',
      is_active: true,
      metadata: JSON.stringify({
        enhancement_task_id: `task_${Date.now()}`,
        description: 'AI image enhancement'
      }),
      transaction_id: `test_deduction_${Date.now()}`
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding credit deduction:', error)
  } else {
    console.log('✅ Deducted 50 credits for image enhancement')
  }
}

async function getUserCredits() {
  console.log('📊 Current credit balance:')

  const { data: credits, error } = await supabase
    .from('credits')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching credits:', error)
    return
  }

  let subscriptionCredits = 0
  let permanentCredits = 0
  let totalDeductions = 0

  for (const credit of credits || []) {
    const amount = credit.amount || 0

    if (amount > 0) {
      // Credit addition
      if (credit.expires_at && credit.expires_at !== '9999-12-31T23:59:59.999Z') {
        subscriptionCredits += amount
      } else {
        permanentCredits += amount
      }
    } else {
      // Credit deduction
      totalDeductions += Math.abs(amount)
    }
  }

  const totalCredits = subscriptionCredits + permanentCredits
  const remainingCredits = totalCredits - totalDeductions

  console.log(`💰 Total Credits: ${totalCredits.toLocaleString()}`)
  console.log(`📅 Subscription Credits: ${subscriptionCredits.toLocaleString()}`)
  console.log(`⭐ Permanent Credits: ${permanentCredits.toLocaleString()}`)
  console.log(`📉 Total Deductions: ${totalDeductions.toLocaleString()}`)
  console.log(`🎯 Remaining Credits: ${remainingCredits.toLocaleString()}`)
}

async function runTests() {
  console.log('🧪 Testing Credits System\n')
  console.log('Using test user ID:', TEST_USER_ID)
  console.log('⚠️  Make sure to replace TEST_USER_ID with a real user ID from your database\n')

  await getUserCredits()
  console.log('')

  await testSubscriptionCredits()
  await testPermanentCredits()
  await testCreditDeduction()

  console.log('')
  await getUserCredits()

  console.log('\n✨ Credit system test completed!')
  console.log('Check your dashboard to see the new credits and recent activity.')
}

runTests().catch(console.error)