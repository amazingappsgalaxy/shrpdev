/**
 * Quick helper to get your user ID from the database
 * Run with: npx tsx scripts/get-user-id.ts <email>
 */

import { supabaseAdmin } from '../src/lib/supabase'

async function getUserId(email?: string) {
    console.log('🔍 Looking up user...\n')

    if (email) {
        // Look up by email
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, email, subscription_credits, permanent_credits')
            .eq('email', email)
            .single()

        if (error) {
            console.error('❌ Error:', error.message)
            return
        }

        if (!data) {
            console.error('❌ No user found with email:', email)
            return
        }

        console.log('✅ Found user:')
        console.log('   ID:', data.id)
        console.log('   Email:', data.email)
        console.log('   Credits:', (data.subscription_credits || 0) + (data.permanent_credits || 0))
        console.log('\n💡 Run debug script with:')
        console.log(`   npx tsx scripts/debug-credits.ts ${data.id}`)
    } else {
        // List all users
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, email, subscription_credits, permanent_credits, created_at')
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error('❌ Error:', error.message)
            return
        }

        if (!data || data.length === 0) {
            console.error('❌ No users found')
            return
        }

        console.log(`✅ Found ${data.length} recent users:\n`)
        data.forEach((user, i) => {
            const total = (user.subscription_credits || 0) + (user.permanent_credits || 0)
            console.log(`${i + 1}. ${user.email}`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Credits: ${total}`)
            console.log(`   Created: ${user.created_at}`)
            console.log('')
        })

        console.log('💡 To debug a specific user, run:')
        console.log('   npx tsx scripts/get-user-id.ts <email>')
    }
}

const email = process.argv[2]
getUserId(email).catch(console.error)
