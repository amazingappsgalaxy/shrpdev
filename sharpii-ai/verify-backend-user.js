const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

// Load code to prefer .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath })
} else {
    dotenv.config()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase Creds in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function verifyBackend() {
    console.log('🚀 Starting Backend Verification...')
    console.log(`📡 URL: ${supabaseUrl}`)

    // 1. Create a Test User via Admin API
    const testEmail = `backend_test_${Date.now()}@sharpii.ai`
    const testPassword = 'Password123!'

    console.log(`👤 Attempting to create user: ${testEmail}`)

    const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { name: 'Backend Verifier' }
    })

    if (createError) {
        console.error('❌ Failed to create user via Admin API:', createError.message)
        // Check if it's a connection issue or valid auth error
        return false
    }

    console.log('✅ User created successfully via Admin API!')
    console.log(`🆔 User ID: ${user.user.id}`)

    // 2. Verify in public.users table (if trigger exists)
    console.log('🔍 Checking public.users table...')
    // Wait a moment for trigger
    await new Promise(r => setTimeout(r, 2000))

    const { data: publicUser, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.user.id)
        .single()

    if (queryError) {
        console.warn('⚠️ User not found in public.users (Triggers might be missing or slow):', queryError.message)
    } else {
        console.log('✅ User confirmed in public.users table!')
        console.log(`📄 Name: ${publicUser.name}`)
    }

    return true
}

verifyBackend()
