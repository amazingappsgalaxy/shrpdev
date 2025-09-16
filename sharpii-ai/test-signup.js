const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test Supabase connection and signup functionality
async function testSignup() {
  console.log('🔍 Testing Supabase signup functionality...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('📋 Environment variables:');
  console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test connection
  try {
    console.log('\n🔗 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Connection error:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return;
  }
  
  // Test signup with a test email
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  try {
    console.log('\n📝 Testing signup with:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('❌ Auth signup error:', authError.message);
      return;
    }
    
    console.log('✅ Auth signup successful');
    console.log('- User ID:', authData.user?.id);
    console.log('- Email confirmed:', authData.user?.email_confirmed_at ? 'Yes' : 'No');
    
    // Test creating user profile
    if (authData.user) {
      console.log('\n👤 Testing user profile creation...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testEmail,
          name: 'Test User',
          password_hash: '',
          subscription_status: 'free',
          api_usage: 0,
          monthly_api_limit: 100,
          is_email_verified: false,
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Profile creation error:', profileError.message);
        console.error('- Code:', profileError.code);
        console.error('- Details:', profileError.details);
      } else {
        console.log('✅ User profile created successfully');
        console.log('- Profile ID:', profileData.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Signup test failed:', error.message);
  }
}

testSignup().catch(console.error);