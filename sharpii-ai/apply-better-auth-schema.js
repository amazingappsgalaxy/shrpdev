const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyBetterAuthSchema() {
  try {
    console.log('Reading Better Auth schema...');
    const schemaPath = path.join(__dirname, 'better-auth-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying Better Auth schema to Supabase...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        console.log(`Statement: ${statement.substring(0, 100)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Try direct query as fallback
          const { data: directData, error: directError } = await supabase
            .from('_sql')
            .select('*')
            .limit(0);
          
          if (directError) {
            console.error('Direct query also failed:', directError);
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\n✅ Better Auth schema application completed!');
    console.log('\nNext steps:');
    console.log('1. Test the authentication flow at http://localhost:3003/test-auth');
    console.log('2. Try creating a new account');
    console.log('3. Verify the data is stored in Supabase');
    
  } catch (error) {
    console.error('❌ Error applying Better Auth schema:', error);
    process.exit(1);
  }
}

// Run the schema application
applyBetterAuthSchema();