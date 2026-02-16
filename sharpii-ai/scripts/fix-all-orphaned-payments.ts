/**
 * Find and fix ALL orphaned payments across all users
 * Run with: npx tsx scripts/fix-all-orphaned-payments.ts [--dry-run]
 */

import { supabaseAdmin } from '../src/lib/supabase'
import { CreditsService } from '../src/lib/credits-service'

interface OrphanedPayment {
    payment_id: string
    user_id: string
    user_email: string
    plan: string
    billing_period: string
    amount: number
    currency: string
    paid_at: string
}

async function findAllOrphanedPayments(): Promise<OrphanedPayment[]> {
    console.log('🔍 Scanning for orphaned payments...\n')

    // Get all successful payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select('dodo_payment_id, user_id, plan, billing_period, amount, currency, paid_at, metadata')
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })

    if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError)
        return []
    }

    console.log(`Found ${payments.length} successful payments`)

    // Get all credit records
    const { data: credits, error: creditsError } = await supabaseAdmin
        .from('credits')
        .select('transaction_id')

    if (creditsError) {
        console.error('❌ Error fetching credits:', creditsError)
        return []
    }

    const creditTransactionIds = new Set(credits.map(c => c.transaction_id))
    console.log(`Found ${credits.length} credit records\n`)

    // Find orphaned payments
    const orphaned: OrphanedPayment[] = []

    for (const payment of payments) {
        if (!creditTransactionIds.has(payment.dodo_payment_id)) {
            // Get user email
            const { data: user } = await supabaseAdmin
                .from('users')
                .select('email')
                .eq('id', payment.user_id)
                .single()

            orphaned.push({
                payment_id: payment.dodo_payment_id,
                user_id: payment.user_id,
                user_email: user?.email || 'unknown',
                plan: payment.plan,
                billing_period: payment.billing_period,
                amount: payment.amount,
                currency: payment.currency,
                paid_at: payment.paid_at
            })
        }
    }

    return orphaned
}

async function fixOrphanedPayment(payment: OrphanedPayment, dryRun: boolean): Promise<boolean> {
    if (dryRun) {
        console.log('   [DRY RUN] Would allocate credits')
        return true
    }

    try {
        const result = await CreditsService.allocateSubscriptionCredits(
            payment.user_id,
            payment.plan,
            payment.billing_period as 'monthly' | 'yearly',
            null, // No subscription ID for orphaned payments
            payment.payment_id
        )

        if (result.success && !result.duplicate) {
            return true
        } else if (result.duplicate) {
            console.log('   ⚠️ Credits already exist (duplicate)')
            return false
        } else {
            console.log('   ❌ Failed:', result.message)
            return false
        }
    } catch (error: any) {
        console.log('   ❌ Error:', error.message)
        return false
    }
}

async function main() {
    const dryRun = process.argv.includes('--dry-run')

    console.log('🔧 Fix All Orphaned Payments')
    console.log('='.repeat(60))

    if (dryRun) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n')
    }

    // Find all orphaned payments
    const orphaned = await findAllOrphanedPayments()

    if (orphaned.length === 0) {
        console.log('✅ No orphaned payments found!')
        console.log('   All payments have corresponding credits.')
        return
    }

    console.log(`⚠️  Found ${orphaned.length} orphaned payments:\n`)

    // Display all orphaned payments
    orphaned.forEach((payment, i) => {
        console.log(`${i + 1}. ${payment.payment_id}`)
        console.log(`   User: ${payment.user_email} (${payment.user_id})`)
        console.log(`   Plan: ${payment.plan} (${payment.billing_period})`)
        console.log(`   Amount: ${payment.amount} ${payment.currency}`)
        console.log(`   Paid: ${payment.paid_at}`)
        console.log('')
    })

    if (dryRun) {
        console.log('💡 Run without --dry-run to fix these payments')
        return
    }

    // Ask for confirmation
    console.log('⚠️  About to allocate credits for these payments.')
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')

    await new Promise(resolve => setTimeout(resolve, 5000))

    // Fix each orphaned payment
    console.log('🔧 Fixing orphaned payments...\n')

    let fixed = 0
    let failed = 0
    let skipped = 0

    for (let i = 0; i < orphaned.length; i++) {
        const payment = orphaned[i]
        console.log(`[${i + 1}/${orphaned.length}] ${payment.payment_id}`)
        console.log(`   User: ${payment.user_email}`)

        const success = await fixOrphanedPayment(payment, dryRun)

        if (success) {
            console.log('   ✅ Credits allocated')
            fixed++
        } else {
            if (payment.payment_id.includes('duplicate')) {
                skipped++
            } else {
                failed++
            }
        }

        console.log('')
    }

    // Summary
    console.log('='.repeat(60))
    console.log('📊 Summary:')
    console.log(`   Total orphaned: ${orphaned.length}`)
    console.log(`   ✅ Fixed: ${fixed}`)
    console.log(`   ⚠️  Skipped: ${skipped}`)
    console.log(`   ❌ Failed: ${failed}`)

    if (failed > 0) {
        console.log('\n⚠️  Some payments failed to fix. Check the errors above.')
        console.log('   You may need to:')
        console.log('   1. Apply the database migration first')
        console.log('   2. Check the webhook logs for errors')
        console.log('   3. Manually fix using: npx tsx scripts/fix-orphaned-payment.ts <payment-id>')
    }

    if (fixed > 0) {
        console.log('\n✅ Credits have been allocated!')
        console.log('   Users should now see their credits in the dashboard.')
    }

    console.log('\n💡 Next steps:')
    console.log('   1. Verify credits in dashboard')
    console.log('   2. Check user balances: npx tsx scripts/get-user-id.ts')
    console.log('   3. Test new payments to ensure they work correctly')
}

main().catch(console.error)
