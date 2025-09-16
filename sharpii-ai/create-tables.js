const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ftndokqxuumwxsbwatbo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bmRva3F4dXVtd3hzYndhdGJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUxODM2NSwiZXhwIjoyMDczMDk0MzY1fQ.qUM7B2niDPA8Ivk_qOR1XY6MKtf2Oxvhu38G6SIXDWo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  try {
    console.log('🚀 Creating essential database tables...');
    
    // First, let's try to create a test user to see if we can insert data
    console.log('👤 Testing user creation...');
    
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      name: 'Test User',
      password_hash: '$2a$10$test.hash.here',
      subscription_status: 'free',
      api_usage: 0,
      monthly_api_limit: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
      is_email_verified: false,
      last_login_at: null
    };
    
    // Try to insert a test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([testUser])
      .select();
    
    if (userError) {
      console.log('❌ Users table error:', userError.message);
      
      if (userError.message.includes('does not exist')) {
        console.log('📋 The users table does not exist. Please create it manually in Supabase.');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/ftndokqxuumwxsbwatbo/editor');
        console.log('📝 Run this SQL in the SQL Editor:');
        console.log(`\nCREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  subscription_status VARCHAR(50) DEFAULT 'free',
  api_usage INTEGER DEFAULT 0,
  monthly_api_limit INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
`);
        return;
      }
    } else {
      console.log('✅ Users table exists and is working!');
      console.log('👤 Test user created:', userData);
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('id', testUser.id);
      
      console.log('🧹 Test user cleaned up');
    }
    
    // Test sessions table
    console.log('🔐 Testing sessions table...');
    const { error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .limit(1);
    
    if (sessionError) {
      console.log('❌ Sessions table error:', sessionError.message);
    } else {
      console.log('✅ Sessions table exists!');
    }
    
    // Test user_activity table
    console.log('📊 Testing user_activity table...');
    const { error: activityError } = await supabase
      .from('user_activity')
      .select('id')
      .limit(1);
    
    if (activityError) {
      console.log('❌ User activity table error:', activityError.message);
    } else {
      console.log('✅ User activity table exists!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTables()
  .then(() => {
    console.log('🏁 Table check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });