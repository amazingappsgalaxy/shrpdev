
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    console.log('Testing connection to:', supabaseUrl);

    // Test 1: Fetch Credits
    console.log('\n--- Fetching Credits ---');
    const { data: credits, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .limit(1);

    if (creditsError) {
        console.error('Error fetching credits:', JSON.stringify(creditsError, null, 2));
    } else {
        console.log('Success fetching credits:', credits);
    }

    // Test 2: Fetch Credit Transactions
    console.log('\n--- Fetching Credit Transactions ---');
    const { data: trans, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .limit(1);

    if (transError) {
        console.error('Error fetching transactions:', JSON.stringify(transError, null, 2));
    } else {
        console.log('Success fetching transactions:', trans);
    }
}

testFetch();
