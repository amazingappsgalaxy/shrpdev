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

async function checkSessions() {
  const USER_ID = '11111111-1111-1111-1111-111111111111';
  console.log(`Checking sessions for user ${USER_ID}...`);

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', USER_ID);

  if (error) {
    console.error('Error fetching sessions:', error);
  } else {
    console.log(`Found ${sessions.length} sessions.`);
    sessions.forEach(s => {
      console.log(`- ID: ${s.id}, Expires: ${new Date(s.expires_at).toLocaleString()}, IP: ${s.ip_address}`);
    });
  }
}

checkSessions();
