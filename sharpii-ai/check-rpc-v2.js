const { createClient } = require('@supabase/supabase-js');

const url = 'https://igsyhvrctnqntqujqfif.supabase.co';
const key = 'REMOVED'; // From .env.local

const supabase = createClient(url, key);

async function check() {
  console.log('Checking for exec_sql RPC...');
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
  }
}

check();
