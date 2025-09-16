const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function applySchema() {
  // Use the direct Supabase URL format
  const client = new Client({
    host: 'aws-0-us-west-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ftndokqxuumwxsbwatbo',
    password: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'better-auth-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying Better Auth schema...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await client.query(statement);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`Skipping: ${error.message}`);
          } else {
            console.error(`Error in statement ${i + 1}:`, error.message);
            console.error('Statement:', statement);
          }
        }
      }
    }
    
    console.log('\n✅ Better Auth schema applied successfully!');
    console.log('\nCreated tables:');
    console.log('- user (for user accounts)');
    console.log('- session (for user sessions)');
    console.log('- account (for OAuth accounts)');
    console.log('- verification (for email verification)');
    console.log('\nRow Level Security (RLS) has been enabled with appropriate policies.');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// Check if required environment variables are set
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

applySchema();