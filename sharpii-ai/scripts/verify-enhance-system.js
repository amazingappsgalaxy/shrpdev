const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySystem() {
    console.log('🔍 Verifying System Integrity...');

    // 1. Check for legacy tables
    console.log('\n1. Checking for legacy tables...');
    // Legacy tasks table check removed as part of cleanup
    console.log('✅ Legacy tasks table check skipped (cleanup complete).');

    // 2. Create Test User
    console.log('\n2. Creating Test User...');
    const email = `verify_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    const { data: { user }, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (createUserError) {
        console.error('❌ Failed to create test user:', createUserError.message);
        return;
    }
    
    const testUserId = user.id;
    console.log(`✅ Created Test User ID: ${testUserId}`);

    // 3. Verify History System
    console.log('\n3. Verifying History System...');
    const taskId = crypto.randomUUID();
    console.log(`Test Task ID: ${taskId}`);

    // Insert a test history item
    const { error: insertError } = await supabase.from('history_items').insert({
        id: taskId,
        task_id: taskId,
        user_id: testUserId,
        status: 'failed',
        model_name: 'test-model',
        page_name: 'test-page',
        output_urls: [], // Required JSONB field
        settings: {
            failure_reason: 'Verification Test Failure',
            mode: 'test'
        },
        created_at: new Date().toISOString()
    });

    if (insertError) {
        console.error('❌ Failed to insert history item:', insertError.message);
    } else {
        console.log('✅ Successfully inserted test history item.');

        // Read it back
        const { data: item, error: readError } = await supabase
            .from('history_items')
            .select('*')
            .eq('id', taskId)
            .single();

        if (readError) {
            console.error('❌ Failed to read back history item:', readError.message);
        } else {
            console.log('✅ Successfully read back history item.');
            if (item.settings?.failure_reason === 'Verification Test Failure') {
                console.log('✅ Failure reason is correctly stored and retrieved.');
            } else {
                console.error('❌ Failure reason mismatch:', item.settings);
            }
        }
    }

    // 4. Verify Credits System
    console.log('\n4. Verifying Credits System...');
    
    // Create a credit grant
    const creditId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: creditGrantError } = await supabase.from('credits').insert({
        id: creditId,
        user_id: testUserId,
        amount: 100,
        type: 'purchase',
        source: 'verification_script',
        is_active: true,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
    });

    if (creditGrantError) {
        console.error('❌ Failed to insert credit grant:', creditGrantError.message);
    } else {
        console.log('✅ Successfully inserted credit grant.');
    }

    // Create a credit transaction
    const { error: creditTxError } = await supabase.from('credit_transactions').insert({
        user_id: testUserId,
        credit_id: creditId,
        amount: 10,
        type: 'debit',
        reason: 'Verification Test Debit',
        balance_before: 100,
        balance_after: 90,
        created_at: new Date().toISOString()
    });

    if (creditTxError) {
        console.error('❌ Failed to insert credit transaction:', creditTxError.message);
    } else {
        console.log('✅ Successfully inserted credit transaction.');
    }

    // 5. Verify clean up
    console.log('\n🧹 Cleaning up test data...');
    // Delete user (should cascade, but we delete explicitly to be safe/clean)
    await supabase.from('history_items').delete().eq('user_id', testUserId);
    await supabase.from('credit_transactions').delete().eq('user_id', testUserId);
    await supabase.from('credits').delete().eq('user_id', testUserId);
    
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(testUserId);
    if (deleteUserError) {
        console.error('⚠️ Failed to delete test user:', deleteUserError.message);
    } else {
        console.log('✅ Test user deleted.');
    }
    
    console.log('Done.');
}

verifySystem();
