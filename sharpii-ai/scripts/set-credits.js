
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setCredits(amount) {
  const userId = '70288de8-b892-4403-ab4a-0a8ab5517474';
  console.log(`Setting credits for ${userId} to ${amount}...`);

  // 1. Deactivate all existing active credits
  const { error: updateError } = await supabase
    .from('credits')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (updateError) {
    console.error('Error deactivating credits:', updateError);
    return;
  }

  // 2. If amount > 0, add new credit
  if (amount > 0) {
    // We also need to account for existing debit transactions to make the net balance correct.
    // Or we can just insert a huge credit amount that covers debits + target amount.
    // Let's calculate current "used" credits first.
    
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'debit');

    if (transError) {
      console.error('Error fetching transactions:', transError);
      return;
    }

    const usedCredits = Math.abs(transactions?.reduce((sum, t) => sum + t.amount, 0) || 0);
    const amountToGrant = usedCredits + amount;

    const { error: insertError } = await supabase
      .from('credits')
      .insert({
        user_id: userId,
        amount: amountToGrant,
        type: 'manual_set',
        source: 'admin_script',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      });

    if (insertError) {
      console.error('Error inserting credit:', insertError);
      return;
    }
  }

  console.log(`Successfully set credits to approx ${amount}.`);
}

const amount = parseInt(process.argv[2], 10);
if (isNaN(amount)) {
  console.log('Usage: node set-credits.js <amount>');
  process.exit(1);
}

setCredits(amount);
