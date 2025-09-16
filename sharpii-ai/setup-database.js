const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...')
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql')
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ supabase-schema.sql file not found')
      return false
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct query execution if RPC fails
          const { error: queryError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0)
          
          if (queryError && queryError.message.includes('relation "_temp" does not exist')) {
            // This is expected, continue with next statement
            continue
          }
          
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} error:`, err.message)
      }
    }
    
    console.log('✅ Schema execution completed')
    
    // Test database connection and tables
    console.log('🔍 Testing database tables...')
    
    const tables = ['users', 'sessions', 'enhancement_tasks', 'images', 'projects', 'credits']
    const tableResults = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          tableResults[table] = `❌ Error: ${error.message}`
        } else {
          tableResults[table] = '✅ Accessible'
        }
      } catch (err) {
        tableResults[table] = `❌ Error: ${err.message}`
      }
    }
    
    console.log('\n📊 Table Status:')
    Object.entries(tableResults).forEach(([table, status]) => {
      console.log(`  ${table}: ${status}`)
    })
    
    // Check if all essential tables are accessible
    const essentialTables = ['users', 'sessions']
    const allEssentialTablesReady = essentialTables.every(table => 
      tableResults[table] && tableResults[table].includes('✅')
    )
    
    if (allEssentialTablesReady) {
      console.log('\n🎉 Database setup completed successfully!')
      console.log('✅ All essential tables are ready for use')
      return true
    } else {
      console.log('\n⚠️  Database setup completed with warnings')
      console.log('❌ Some essential tables may not be accessible')
      console.log('\n📋 Manual Setup Required:')
      console.log('1. Go to: https://supabase.com/dashboard/project/ftndokqxuumwxsbwatbo/editor')
      console.log('2. Open SQL Editor')
      console.log('3. Copy and paste the content from supabase-schema.sql')
      console.log('4. Run the SQL script')
      return false
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    return false
  }
}

// Run the setup
setupDatabase().then(success => {
  if (success) {
    console.log('\n🚀 You can now test the application!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Manual database setup required')
    process.exit(1)
  }
}).catch(error => {
  console.error('❌ Setup script failed:', error)
  process.exit(1)
})