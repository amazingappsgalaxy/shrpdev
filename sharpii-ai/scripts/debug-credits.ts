/**
 * Debug script to check credit allocation issues
 * Run with: npx tsx scripts/debug-credits.ts <user-id>
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function debugCredits(userId: string) {
    console.log('🔍 Debugging credits for user:', userId)
    console.log('='.repeat(60))

    // 1. Check user record
    console.log('\n1️⃣ Checking user record...')
    const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, subscription_credits, permanent_credits, subscription_credits_expire_at')
        .eq('id', userId)
        .single()

    if (userError) {
        console.error('❌ Error fetching user:', userError)
        return
    }

    console.log('User:', {
        email: user.email,
        subscription_credits: user.subscription_credits,
        permanent_credits: user.permanent_credits,
        total: (user.subscription_credits || 0) + (user.permanent_credits || 0),
        expire_at: user.subscription_credits_expire_at
    })

    // 2. Check payments
    console.log('\n2️⃣ Checking payments...')
    const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

    if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError)
    } else {
        console.log(`Found ${payments.length} payments:`)
        payments.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.dodo_payment_id} - ${p.plan} - ${p.status} - ${p.amount} ${p.currency}`)
            console.log(`     Created: ${p.created_at}`)
        })
    }

    // 3. Check credits table
    console.log('\n3️⃣ Checking credits table...')
    const { data: credits, error: creditsError } = await supabaseAdmin
        .from('credits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

    if (creditsError) {
        console.error('❌ Error fetching credits:', creditsError)
    } else {
        console.log(`Found ${credits.length} credit records:`)
        credits.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.transaction_id} - ${c.amount} credits - ${c.credit_type}`)
            console.log(`     Active: ${c.is_active}, Expires: ${c.expires_at}`)
            console.log(`     Description: ${c.description}`)
        })
    }

    // 4. Check credit transactions
    console.log('\n4️⃣ Checking credit transactions...')
    const { data: transactions, error: transactionsError } = await supabaseAdmin
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

    if (transactionsError) {
        console.error('❌ Error fetching transactions:', transactionsError)
    } else {
        console.log(`Found ${transactions.length} transactions:`)
        transactions.forEach((t, i) => {
            console.log(`  ${i + 1}. ${t.type} - ${t.amount} - ${t.reason}`)
            console.log(`     ${t.description}`)
            console.log(`     Created: ${t.created_at}`)
        })
    }

    // 5. Test get_user_credits function
    console.log('\n5️⃣ Testing get_user_credits function...')
    const { data: creditsData, error: creditsRpcError } = await supabaseAdmin
        .rpc('get_user_credits', { p_user_id: userId })

    if (creditsRpcError) {
        console.error('❌ Error calling get_user_credits:', creditsRpcError)
    } else {
        console.log('Function result:', creditsData)
    }

    // 6. Check for orphaned payments (payments without credits)
    console.log('\n6️⃣ Checking for orphaned payments...')
    if (payments && credits) {
        const paymentIds = new Set(payments.map(p => p.dodo_payment_id))
        const creditTransactionIds = new Set(credits.map(c => c.transaction_id))

        const orphanedPayments = payments.filter(p => !creditTransactionIds.has(p.dodo_payment_id))

        if (orphanedPayments.length > 0) {
            console.log(`⚠️ Found ${orphanedPayments.length} payments without credits:`)
            orphanedPayments.forEach(p => {
                console.log(`  - ${p.dodo_payment_id} (${p.plan}, ${p.amount} ${p.currency})`)
                console.log(`    Paid at: ${p.paid_at}`)
                console.log(`    Metadata:`, p.metadata)
            })
        } else {
            console.log('✅ All payments have corresponding credits')
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('🏁 Debug complete!')
}

// Get user ID from command line
const userId = process.argv[2]

if (!userId) {
    console.error('Usage: npx tsx scripts/debug-credits.ts <user-id>')
    process.exit(1)
}

debugCredits(userId).catch(console.error)
