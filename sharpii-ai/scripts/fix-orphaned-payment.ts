/**
 * Manually allocate credits for orphaned payments
 * Run with: npx tsx scripts/fix-orphaned-payment.ts <payment-id>
 */

import { supabaseAdmin } from '../src/lib/supabase'
import { CreditsService } from '../src/lib/credits-service'

async function fixOrphanedPayment(paymentId: string) {
    console.log('🔧 Fixing orphaned payment:', paymentId)
    console.log('='.repeat(60))

    // 1. Get payment details
    console.log('\n1️⃣ Fetching payment details...')
    const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('dodo_payment_id', paymentId)
        .single()

    if (paymentError || !payment) {
        console.error('❌ Payment not found:', paymentError?.message || 'No data')
        return
    }

    console.log('Payment found:')
    console.log('  User ID:', payment.user_id)
    console.log('  Plan:', payment.plan)
    console.log('  Billing Period:', payment.billing_period)
    console.log('  Amount:', payment.amount, payment.currency)
    console.log('  Status:', payment.status)

    // 2. Check if credits already exist
    console.log('\n2️⃣ Checking for existing credits...')
    const { data: existingCredits } = await supabaseAdmin
        .from('credits')
        .select('id')
        .eq('user_id', payment.user_id)
        .eq('transaction_id', paymentId)

    if (existingCredits && existingCredits.length > 0) {
        console.log('⚠️ Credits already exist for this payment!')
        console.log('   Credit IDs:', existingCredits.map(c => c.id).join(', '))
        console.log('   No action needed.')
        return
    }

    console.log('✅ No existing credits found. Proceeding with allocation...')

    // 3. Allocate credits
    console.log('\n3️⃣ Allocating credits...')

    try {
        const result = await CreditsService.allocateSubscriptionCredits(
            payment.user_id,
            payment.plan,
            payment.billing_period as 'monthly' | 'yearly',
            payment.metadata?.subscription_id || null,
            paymentId
        )

        if (result.success) {
            if (result.duplicate) {
                console.log('⚠️ Duplicate detected (credits already allocated)')
            } else {
                console.log('✅ Credits allocated successfully!')
                console.log('   Message:', result.message)
            }
        } else {
            console.log('❌ Failed to allocate credits')
            console.log('   Message:', result.message)
        }
    } catch (error: any) {
        console.error('❌ Error allocating credits:', error.message)
        throw error
    }

    // 4. Verify allocation
    console.log('\n4️⃣ Verifying allocation...')
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('subscription_credits, permanent_credits')
        .eq('id', payment.user_id)
        .single()

    if (user) {
        const total = (user.subscription_credits || 0) + (user.permanent_credits || 0)
        console.log('✅ User now has:')
        console.log('   Subscription Credits:', user.subscription_credits)
        console.log('   Permanent Credits:', user.permanent_credits)
        console.log('   Total:', total)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🏁 Fix complete!')
}

// Get payment ID from command line
const paymentId = process.argv[2]

if (!paymentId) {
    console.error('Usage: npx tsx scripts/fix-orphaned-payment.ts <payment-id>')
    console.error('\nExample:')
    console.error('  npx tsx scripts/fix-orphaned-payment.ts pay_0NYd4TJnvc0Y42e4HmUky')
    process.exit(1)
}

fixOrphanedPayment(paymentId).catch(console.error)
