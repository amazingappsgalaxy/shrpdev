const { createClient } = require('@supabase/supabase-js');

const url = 'https://igsyhvrctnqntqujqfif.supabase.co';
const key = 'REMOVED'; // From .env.local

const supabase = createClient(url, key);

async function checkTables() {
  console.log('Checking public tables...');
  // Since we can't list tables easily via client without RPC, we try to select from 'users'
  const { data, error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.error('Error selecting from users:', error);
  } else {
    console.log('Users table exists. Row count:', data.length);
  }

  const { data: hData, error: hError } = await supabase.from('history_items').select('id').limit(1);
  if (hError) {
    console.error('Error selecting from history_items:', hError);
  } else {
    console.log('History_items table exists. Row count:', hData.length);
  }
}

checkTables();
