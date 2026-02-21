const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function checkTables() {
  console.log('Checking public tables...');
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
