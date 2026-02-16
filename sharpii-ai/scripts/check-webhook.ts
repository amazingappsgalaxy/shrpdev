/**
 * Check webhook endpoint health and configuration
 * Run with: npx tsx scripts/check-webhook.ts
 */

import fetch from 'node-fetch'

const LOCAL_URL = 'http://localhost:3004/api/payments/webhook'
const TUNNEL_URL = process.env.TUNNEL_URL || 'https://enrolled-artwork-bean-payments.trycloudflare.com/api/payments/webhook'

async function checkEndpoint(url: string, name: string) {
    console.log(`\n🔍 Checking ${name}...`)
    console.log(`   URL: ${url}`)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'test.ping',
                data: { test: true }
            })
        })

        const result = await response.text()

        if (response.ok) {
            console.log(`   ✅ Endpoint is reachable (${response.status})`)
            console.log(`   Response: ${result}`)
            return true
        } else {
            console.log(`   ⚠️ Endpoint returned ${response.status}`)
            console.log(`   Response: ${result}`)
            return false
        }
    } catch (error: any) {
        console.log(`   ❌ Endpoint not reachable`)
        console.log(`   Error: ${error.message}`)
        return false
    }
}

async function checkDatabaseFunctions() {
    console.log('\n🔍 Checking database functions...')

    const { supabaseAdmin } = await import('../src/lib/supabase')

    const functions = [
        'add_credits_atomic',
        'deduct_credits_atomic',
        'get_user_credits',
        'expire_subscription_credits'
    ]

    for (const funcName of functions) {
        try {
            // Try to call the function with dummy data to see if it exists
            const { error } = await supabaseAdmin.rpc(funcName as any, {})

            if (error) {
                // Check if error is about missing parameters (function exists) or missing function
                if (error.message.includes('does not exist')) {
                    console.log(`   ❌ ${funcName} - NOT FOUND`)
                } else {
                    console.log(`   ✅ ${funcName} - EXISTS`)
                }
            } else {
                console.log(`   ✅ ${funcName} - EXISTS`)
            }
        } catch (e: any) {
            console.log(`   ⚠️ ${funcName} - ${e.message}`)
        }
    }
}

async function checkDatabaseSchema() {
    console.log('\n🔍 Checking database schema...')

    const { supabaseAdmin } = await import('../src/lib/supabase')

    // Check users table columns
    const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('subscription_credits, permanent_credits, subscription_credits_expire_at')
        .limit(1)

    if (usersError) {
        if (usersError.message.includes('column') && usersError.message.includes('does not exist')) {
            console.log('   ❌ Users table missing credit columns')
            console.log('   💡 Run migration: data/db/migrations/20260216_fix_billing_system.sql')
        } else {
            console.log('   ⚠️ Error checking users table:', usersError.message)
        }
    } else {
        console.log('   ✅ Users table has credit columns')
    }

    // Check credits table
    const { data: credits, error: creditsError } = await supabaseAdmin
        .from('credits')
        .select('credit_type, expires_at, is_active')
        .limit(1)

    if (creditsError) {
        if (creditsError.message.includes('column') && creditsError.message.includes('does not exist')) {
            console.log('   ❌ Credits table missing required columns')
            console.log('   💡 Run migration: data/db/migrations/20260216_fix_billing_system.sql')
        } else {
            console.log('   ⚠️ Error checking credits table:', creditsError.message)
        }
    } else {
        console.log('   ✅ Credits table has required columns')
    }
}

async function checkEnvironment() {
    console.log('\n🔍 Checking environment variables...')

    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DODO_PAYMENTS_API_KEY',
        'DODO_PAYMENTS_WEBHOOK_SECRET'
    ]

    for (const varName of requiredVars) {
        const value = process.env[varName]
        if (value) {
            console.log(`   ✅ ${varName} - SET`)
        } else {
            console.log(`   ❌ ${varName} - NOT SET`)
        }
    }
}

async function main() {
    console.log('🏥 Webhook Health Check')
    console.log('='.repeat(60))

    // Check environment
    await checkEnvironment()

    // Check local endpoint
    const localOk = await checkEndpoint(LOCAL_URL, 'Local Endpoint')

    // Check tunnel endpoint
    const tunnelOk = await checkEndpoint(TUNNEL_URL, 'Tunnel Endpoint')

    // Check database
    await checkDatabaseSchema()
    await checkDatabaseFunctions()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`   Local Endpoint: ${localOk ? '✅ OK' : '❌ FAILED'}`)
    console.log(`   Tunnel Endpoint: ${tunnelOk ? '✅ OK' : '❌ FAILED'}`)

    if (!localOk) {
        console.log('\n⚠️ Local endpoint not reachable!')
        console.log('   Make sure Next.js is running: npm run dev')
    }

    if (!tunnelOk) {
        console.log('\n⚠️ Tunnel endpoint not reachable!')
        console.log('   Make sure Cloudflare tunnel is running')
        console.log('   Or update TUNNEL_URL in this script')
    }

    console.log('\n💡 Next steps:')
    console.log('   1. Fix any issues shown above')
    console.log('   2. Get your user ID: npx tsx scripts/get-user-id.ts')
    console.log('   3. Debug credits: npx tsx scripts/debug-credits.ts <user-id>')
    console.log('   4. Test webhook: npx tsx scripts/test-webhook.ts')
}

main().catch(console.error)
