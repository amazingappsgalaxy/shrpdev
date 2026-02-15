const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantCredits() {
  const USER_ID = '11111111-1111-1111-1111-111111111111';
  console.log(`Granting credits to ${USER_ID}...`);

  // First ensure user exists (enhance-image creates it if missing, but let's be safe)
  const { data: user } = await supabase.from('users').select('id').eq('id', USER_ID).single();
  if (!user) {
    console.log('User not found, creating...');
    await supabase.from('users').insert({
      id: USER_ID,
      email: 'test@local.dev',
      name: 'Test User',
      password_hash: 'hash'
    });
  }

  const { data, error } = await supabase
    .from('credits')
    .insert({
      user_id: USER_ID,
      amount: 1000,
      type: 'bonus',
      source: 'admin_grant',
      expires_at: '9999-12-31T23:59:59.999Z',
      is_active: true,
      metadata: { reason: 'testing' }
    })
    .select();

  if (error) {
    console.error('Error granting credits:', error);
  } else {
    console.log('✅ Credits granted:', data);
  }
}

grantCredits();
