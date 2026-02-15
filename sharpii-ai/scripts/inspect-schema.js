const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting schemas...');
    
    // History Items
    const { data: history, error: historyError } = await supabase.from('history_items').select('*').limit(1);
    if (historyError) console.error('History Error:', historyError.message);
    else if (history.length > 0) console.log('History columns:', Object.keys(history[0]));
    else console.log('History table empty, cannot infer columns from data.');

    // Credits
    const { data: credits, error: creditsError } = await supabase.from('credits').select('*').limit(1);
    if (creditsError) console.error('Credits Error:', creditsError.message);
    else if (credits.length > 0) console.log('Credits columns:', Object.keys(credits[0]));
    else console.log('Credits table empty.');

    // Credit Transactions
    const { data: tx, error: txError } = await supabase.from('credit_transactions').select('*').limit(1);
    if (txError) console.error('TX Error:', txError.message);
    else if (tx.length > 0) console.log('TX columns:', Object.keys(tx[0]));
    else console.log('TX table empty.');

    // Check for tasks
    console.log('Checking for legacy tasks table (should not exist)...');
    const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*').limit(1);
    if (tasksError) {
        console.log('Legacy Tasks Check: SUCCESS - Error received as expected:', tasksError.message);
    } else {
        console.warn('Legacy Tasks Check: WARNING - Table exists!', tasks);
    }
}

inspect();
