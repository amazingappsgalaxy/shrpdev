
require('dotenv').config({ path: 'sharpii-ai/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHistoryFlow() {
  console.log('Testing History Flow...');

  // 1. Ensure User
  const testEmail = 'backend-test@example.com';
  let userId;

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', testEmail)
    .single();

  if (existingUser) {
    userId = existingUser.id;
    console.log('Found existing test user:', userId);
  } else {
    // Try to create a user if not exists
    // Note: This might fail if auth.users is required, but we are writing to public.users?
    // Usually public.users is a mirror or the main table.
    // Let's assume we can write to public.users with service key.
    const newId = uuidv4();
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: newId,
        email: testEmail,
        name: 'Backend Test User',
        image: null,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      // Try to get a real user from the DB to proceed
      const { data: anyUser } = await supabase.from('users').select('id').limit(1).single();
      if (anyUser) {
        console.log('Falling back to existing random user:', anyUser.id);
        userId = anyUser.id;
      } else {
        throw new Error('No users found and cannot create one.');
      }
    } else {
      userId = newUser.id;
      console.log('Created new test user:', userId);
    }
  }

  // 2. Insert History Item
  const taskId = uuidv4();
  console.log('Inserting history item for user:', userId, 'Task:', taskId);

  const { data: historyItem, error: historyError } = await supabase
    .from('history_items')
    .insert({
      id: taskId,
      user_id: userId,
      task_id: taskId,
      output_urls: [],
      model_name: 'test-model',
      page_name: 'test-script',
      status: 'processing',
      settings: { test: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (historyError) {
    console.error('Failed to insert history item:', historyError);
    throw historyError;
  }

  console.log('History item inserted successfully:', historyItem.id);

  // 3. Update History Item
  console.log('Updating history item status...');
  const { error: updateError } = await supabase
    .from('history_items')
    .update({ status: 'completed', output_urls: [{ type: 'image', url: 'http://example.com/img.jpg' }] })
    .eq('id', taskId);

  if (updateError) {
    console.error('Failed to update history item:', updateError);
    throw updateError;
  }
  console.log('History item updated.');

  // 4. Query History Items (simulate list API)
  console.log('Querying history items...');
  const { data: listData, error: listError } = await supabase
    .from('history_items')
    .select('id, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (listError) {
    console.error('Failed to list history items:', listError);
    throw listError;
  }

  console.log('Found items:', listData.length);
  console.log('Top item:', listData[0]);

  console.log('TEST PASSED');
}

testHistoryFlow().catch(e => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});
