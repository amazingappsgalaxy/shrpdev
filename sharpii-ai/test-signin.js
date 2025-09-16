require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase sign-in functionality...');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('📋 Environment variables:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignIn() {
  try {
    console.log('\n🔗 Testing Supabase connection...');
    
    // Test connection by getting session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ Session check error:', sessionError.message);
      return;
    }
    console.log('✅ Supabase connection successful');
    
    // Test sign in with a test account
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';
    
    console.log(`\n📝 Testing sign-in with: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log('❌ Auth sign-in error:', error.message);
      
      // If user doesn't exist, try to create one first
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n🔄 User might not exist, trying to create account first...');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword
        });
        
        if (signUpError) {
          console.log('❌ Sign-up error:', signUpError.message);
        } else {
          console.log('✅ Account created successfully');
          console.log('ℹ️  Note: You may need to verify email before signing in');
        }
      }
    } else {
      console.log('✅ Sign-in successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testSignIn();