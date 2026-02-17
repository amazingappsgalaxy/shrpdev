
/**
 * Test webhook handler locally ON PORT 3003
 * Run with: npx tsx scripts/test-webhook-correct.ts
 */

import fetch from 'node-fetch'

const WEBHOOK_URL = 'http://localhost:3003/api/payments/webhook'

// Mock User ID from previous logs
const MOCK_USER_ID = '04636b0b-e4b3-4b0c-8154-226894a12cfb'

// Sample subscription.active event
const subscriptionActiveEvent = {
    type: 'subscription.active',
    data: {
        subscription_id: `sub_test_fix_${Date.now()}`,
        id: `sub_test_fix_${Date.now()}`,
        customer_id: 'cus_test_fix_123',
        plan: 'creator',
        billing_period: 'monthly',
        status: 'active',
        latest_payment_id: `pay_test_fix_${Date.now()}`,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
            userId: MOCK_USER_ID,
            plan: 'creator',
            billingPeriod: 'monthly'
        }
    }
}

async function testWebhook(event: any, eventName: string) {
    console.log(`\n🧪 Testing ${eventName} on ${WEBHOOK_URL}...`)

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event)
        })

        const result = await response.json()
        console.log(`✅ Response (${response.status}):`, result)

        if (!response.ok) {
            console.error('❌ Webhook failed!')
        }
    } catch (error: any) {
        console.error('❌ Error calling webhook:', error.message)
    }
}

async function main() {
    await testWebhook(subscriptionActiveEvent, 'subscription.active')
}

main().catch(console.error)
