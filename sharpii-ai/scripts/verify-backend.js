const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBackend() {
    console.log('1. Testing Connection & Auth...');
    const email = `test_${Date.now()}@sharpii.ai`;
    const password = 'TestPassword123!';

    // 1. Create User
    const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (signUpError) {
        console.error('❌ Sign Up Error:', signUpError.message);
        return;
    }
    console.log('✅ User created:', user.id);

    // 2. Verify public.users entry
    // The trigger in Supabase (if exists) should handle this. Or the app logic does it.
    // The schema I saw has `users` table but I didn't see a trigger in `supabase-schema.sql` that inserts into public.users on auth.users creation.
    // Wait, looking back at `supabase-schema.sql` lines 252+, I see `update_updated_at_column` triggers but NOT a trigger to copy auth.users to public.users.
    // Unless there is another migration file doing that.

    // Let's check if user exists in public.users
    const { data: publicUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (selectError || !publicUser) {
        console.warn('⚠️ User not found in public.users table. This explains "Failed to find user" error.');
        console.log('Attempting to manually insert into public.users...');

        const { error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    id: user.id,
                    email: email,
                    name: 'Test User',
                    password_hash: 'managed_by_auth', // Placeholder
                }
            ]);

        if (insertError) {
            console.error('❌ Failed to insert into public.users:', insertError.message);
        } else {
            console.log('✅ Manually inserted user into public.users');
        }
    } else {
        console.log('✅ User found in public.users');
    }

    // 3. Test Subscription/Data Access
    console.log('Testing data access...');
    const { data: userData, error: accessError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (accessError) {
        console.error('❌ Data Access Error:', accessError.message);
    } else {
        console.log('✅ Data Access Successful:', userData.email);
    }
}

verifyBackend();
