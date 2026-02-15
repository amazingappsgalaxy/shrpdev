
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRpc() {
  console.log('Testing exec_sql RPC...')
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  if (error) {
    console.error('RPC Failed:', error.message)
    process.exit(1)
  }
  console.log('RPC Success:', data)
}

checkRpc()
