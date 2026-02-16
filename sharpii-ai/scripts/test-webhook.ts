/**
 * Test webhook handler locally
 * Run with: npx tsx scripts/test-webhook.ts
 */

import fetch from 'node-fetch'

const WEBHOOK_URL = 'http://localhost:3004/api/payments/webhook'

// Sample payment.succeeded event
const paymentSucceededEvent = {
    type: 'payment.succeeded',
    data: {
        payment_id: `test_payment_${Date.now()}`,
        id: `test_payment_${Date.now()}`,
        customer_id: 'test_customer_123',
        amount: 2999,
        currency: 'INR',
        status: 'succeeded',
        payment_method: 'card',
        metadata: {
            userId: 'd489bccf-a6fa-4746-a093-e8bf3c4c12d6', // Test user
            plan: 'professional',
            billingPeriod: 'monthly'
        }
    }
}

// Sample subscription.active event
const subscriptionActiveEvent = {
    type: 'subscription.active',
    data: {
        subscription_id: `test_sub_${Date.now()}`,
        id: `test_sub_${Date.now()}`,
        customer_id: 'test_customer_123',
        plan: 'professional',
        billing_period: 'monthly',
        status: 'active',
        latest_payment_id: `test_payment_${Date.now()}`,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
            userId: 'd489bccf-a6fa-4746-a093-e8bf3c4c12d6', // Test user
            plan: 'professional',
            billingPeriod: 'monthly'
        }
    }
}

async function testWebhook(event: any, eventName: string) {
    console.log(`\n🧪 Testing ${eventName}...`)
    console.log('Event data:', JSON.stringify(event, null, 2))

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event)
        })

        const result = await response.json()

        console.log(`\n✅ Response (${response.status}):`, result)

        if (!response.ok) {
            console.error('❌ Webhook failed!')
        }
    } catch (error) {
        console.error('❌ Error calling webhook:', error)
    }
}

async function main() {
    console.log('🔔 Testing Webhook Handler')
    console.log('='.repeat(60))

    // Check if user ID is set
    if (paymentSucceededEvent.data.metadata.userId === 'YOUR_USER_ID_HERE') {
        console.error('\n❌ Please update the userId in the script first!')
        console.error('   Edit scripts/test-webhook.ts and replace YOUR_USER_ID_HERE')
        process.exit(1)
    }

    // Test payment.succeeded
    await testWebhook(paymentSucceededEvent, 'payment.succeeded')

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test subscription.active
    await testWebhook(subscriptionActiveEvent, 'subscription.active')

    console.log('\n' + '='.repeat(60))
    console.log('🏁 Test complete!')
    console.log('\nNext steps:')
    console.log('1. Check the terminal running Next.js for webhook logs')
    console.log('2. Run: npx tsx scripts/debug-credits.ts <user-id>')
    console.log('3. Verify credits were allocated correctly')
}

main().catch(console.error)
