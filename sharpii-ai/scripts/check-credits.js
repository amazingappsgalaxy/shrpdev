
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCredits() {
  const userId = '70288de8-b892-4403-ab4a-0a8ab5517474';
  
  console.log(`Checking credits for user ${userId}...`);
  
  const { data: credits, error } = await supabase
    .from('credits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching credits:', error);
    return;
  }

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'debit');

  const totalGranted = credits.reduce((sum, c) => sum + c.amount, 0);
  const totalUsed = Math.abs(transactions?.reduce((sum, t) => sum + t.amount, 0) || 0);
  const balance = totalGranted - totalUsed;

  console.log('Active Credit Grants:', credits.length);
  console.log('Total Granted:', totalGranted);
  console.log('Total Used:', totalUsed);
  console.log('Net Balance:', balance);
}

checkCredits();
