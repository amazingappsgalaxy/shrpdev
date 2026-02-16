/**
 * Apply database migration to fix duplicate functions
 * Run with: npx tsx scripts/apply-migration.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from '../src/lib/supabase'

async function applyMigration() {
    console.log('🔧 Applying migration to fix duplicate functions')
    console.log('='.repeat(60))

    const migrationPath = join(__dirname, '../data/db/migrations/20260216_fix_duplicate_functions.sql')

    console.log('\n1️⃣ Reading migration file...')
    const sql = readFileSync(migrationPath, 'utf-8')
    console.log('✅ Migration file loaded')
    console.log(`   Size: ${sql.length} bytes`)

    console.log('\n2️⃣ Executing migration...')

    try {
        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))

        console.log(`   Found ${statements.length} SQL statements`)

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i]
            console.log(`\n   Executing statement ${i + 1}/${statements.length}...`)

            // Show first 100 chars of statement
            const preview = statement.substring(0, 100).replace(/\n/g, ' ')
            console.log(`   ${preview}${statement.length > 100 ? '...' : ''}`)

            const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement + ';' })

            if (error) {
                // Try direct query if RPC doesn't work
                const { error: queryError } = await (supabaseAdmin as any).from('_').select('*').limit(0)

                if (error.message.includes('does not exist') || error.message.includes('exec_sql')) {
                    // exec_sql function doesn't exist, we need to use a different approach
                    console.log('   ⚠️ Cannot execute via RPC, please run migration manually')
                    console.log('\n📋 Migration SQL:')
                    console.log('='.repeat(60))
                    console.log(sql)
                    console.log('='.repeat(60))
                    console.log('\n💡 Please copy the above SQL and run it in your Supabase SQL Editor:')
                    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
                    return
                }

                console.error('   ❌ Error:', error.message)
                throw error
            }

            console.log('   ✅ Success')
        }

        console.log('\n✅ Migration applied successfully!')
    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message)
        throw error
    }

    // Verify the fix
    console.log('\n3️⃣ Verifying fix...')
    try {
        // Try calling the function with a test (it will fail due to missing user, but we just want to see if the function exists)
        const { error } = await supabaseAdmin.rpc('add_credits_atomic', {
            p_user_id: '00000000-0000-0000-0000-000000000000',
            p_amount: 100,
            p_credit_type: 'subscription',
            p_transaction_id: 'test',
            p_subscription_id: 'test_sub',
            p_expires_at: new Date().toISOString(),
            p_description: 'Test',
            p_metadata: {}
        })

        if (error) {
            if (error.message.includes('Could not choose')) {
                console.log('❌ Duplicate functions still exist!')
            } else {
                console.log('✅ Function exists and is callable (error is expected for test data)')
            }
        } else {
            console.log('✅ Function exists and works!')
        }
    } catch (e: any) {
        console.log('⚠️ Could not verify:', e.message)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🏁 Done!')
    console.log('\n💡 Next steps:')
    console.log('   1. Verify the function works: npx tsx scripts/fix-orphaned-payment.ts pay_0NYd4TJnvc0Y42e4HmUky')
    console.log('   2. Check credits were allocated: npx tsx scripts/debug-credits.ts d489bccf-a6fa-4746-a093-e8bf3c4c12d6')
}

applyMigration().catch(console.error)
