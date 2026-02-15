
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUserCredits(userId) {
  // Get all active credits for the user
  const { data: credits, error: creditsError } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());

  if (creditsError) {
    console.error('Error fetching user credits:', creditsError);
    return 0;
  }

  // Get total used credits from transactions
  const { data: transactions, error: transError } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'debit');

  if (transError) {
    console.error('Error fetching credit transactions:', transError);
    return 0;
  }

  const totalCredits = credits?.reduce((sum, credit) => sum + credit.amount, 0) || 0;
  const usedCredits = Math.abs(transactions?.reduce((sum, trans) => sum + trans.amount, 0) || 0);
  const remainingCredits = Math.max(0, totalCredits - usedCredits);

  return remainingCredits;
}

async function grantCredits() {
  const userId = '70288de8-b892-4403-ab4a-0a8ab5517474';
  const amount = 5000;

  console.log(`Granting ${amount} credits to user ${userId}...`);

  const currentBalance = await getUserCredits(userId);
  console.log(`Current balance: ${currentBalance}`);

  // 1. Insert into credits
  const { data: creditData, error: creditError } = await supabase
    .from('credits')
    .insert({
      user_id: userId,
      amount: amount,
      type: 'manual_grant',
      source: 'admin_script',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      is_active: true
    })
    .select()
    .single();

  if (creditError) {
    console.error('Error inserting credit:', creditError);
    return;
  }

  // 2. Insert into credit_transactions
  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      credit_id: creditData.id,
      amount: amount,
      type: 'credit',
      reason: 'manual_grant',
      description: 'Manual grant via script',
      balance_before: currentBalance,
      balance_after: currentBalance + amount
    });

  if (txError) {
    console.error('Error recording transaction:', txError);
  }

  const newBalance = await getUserCredits(userId);
  console.log(`Successfully granted ${amount} credits. New balance: ${newBalance}`);
}

grantCredits();
