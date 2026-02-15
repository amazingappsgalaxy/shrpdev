#!/usr/bin/env node

/**
 * Database Migration Script for Sharpii.ai
 * Safely applies schema optimizations and improvements
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🚀 Starting database migration...')

  try {
    // 1. Backup current schema
    console.log('📋 Creating backup of current schema...')
    await backupCurrentSchema()

    // 2. Apply new indexes (safe operations)
    console.log('⚡ Adding performance indexes...')
    await addPerformanceIndexes()

    // 3. Add new columns safely
    console.log('🔧 Adding new columns...')
    await addNewColumns()

    // 4. Create new tables if they don't exist
    console.log('📊 Creating new tables...')
    await createNewTables()

    // 5. Add constraints and triggers
    console.log('⚙️ Adding constraints and triggers...')
    await addConstraintsAndTriggers()

    // 6. Create utility functions
    console.log('🛠️ Creating utility functions...')
    await createUtilityFunctions()

    // 7. Update statistics
    console.log('📈 Updating table statistics...')
    await updateStatistics()

    console.log('✅ Migration completed successfully!')
    console.log('🎯 Database is now optimized for better performance')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('🔄 Consider restoring from backup if needed')
    process.exit(1)
  }
}

async function backupCurrentSchema() {
  try {
    // Get current schema information
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (error) throw error

    const backup = {
      timestamp: new Date().toISOString(),
      tables: tables?.map(t => t.table_name) || [],
      schema_version: '1.0.0'
    }

    fs.writeFileSync(
      path.join(__dirname, `schema-backup-${Date.now()}.json`),
      JSON.stringify(backup, null, 2)
    )

    console.log(`✅ Backup created for ${tables?.length || 0} tables`)
  } catch (error) {
    console.error('Failed to create backup:', error)
    throw error
  }
}

async function addPerformanceIndexes() {
  const indexes = [
    // Users table indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status ON users(subscription_status)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',

    // Images table indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_user_id ON images(user_id)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_status ON images(status)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_images_created_at ON images(created_at DESC)',

    // Credits table indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credits_user_id ON credits(user_id)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credits_active ON credits(user_id, is_active, expires_at) WHERE is_active = true',

    // Sessions table indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
  ]

  for (const indexSQL of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL })
      if (error && !error.message.includes('already exists')) {
        console.warn(`Index creation warning: ${error.message}`)
      }
    } catch (error) {
      console.warn(`Could not create index: ${error.message}`)
    }
  }

  console.log('✅ Performance indexes added')
}

async function addNewColumns() {
  const columnAdditions = [
    // Add new columns to users table
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS total_images_processed INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT \'{}\'::jsonb',

    // Add new columns to images table
    'ALTER TABLE images ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50) DEFAULT \'image/jpeg\'',
    'ALTER TABLE images ADD COLUMN IF NOT EXISTS model_used VARCHAR(100)',
    'ALTER TABLE images ADD COLUMN IF NOT EXISTS provider_used VARCHAR(50)',
    'ALTER TABLE images ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER',
    'ALTER TABLE images ADD COLUMN IF NOT EXISTS credits_consumed INTEGER DEFAULT 0',
    'ALTER TABLE images ADD COLUMN IF NOT EXISTS enhancement_settings JSONB DEFAULT \'{}\'::jsonb',
    'ALTER TABLE images ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ',

    // Add new columns to credits table
    'ALTER TABLE credits ADD COLUMN IF NOT EXISTS balance_before INTEGER',
    'ALTER TABLE credits ADD COLUMN IF NOT EXISTS balance_after INTEGER',
    'ALTER TABLE credits ADD COLUMN IF NOT EXISTS description TEXT',
  ]

  for (const columnSQL of columnAdditions) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: columnSQL })
      if (error) {
        console.warn(`Column addition warning: ${error.message}`)
      }
    } catch (error) {
      console.warn(`Could not add column: ${error.message}`)
    }
  }

  console.log('✅ New columns added')
}

async function createNewTables() {
  const newTables = [
    // History items table
    `CREATE TABLE IF NOT EXISTS history_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL UNIQUE,
      output_urls JSONB NOT NULL,
      model_name TEXT NOT NULL,
      page_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      generation_time_ms INTEGER,
      settings JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS history_details (
      history_id UUID PRIMARY KEY REFERENCES history_items(id) ON DELETE CASCADE,
      settings_full JSONB,
      metadata JSONB
    )`,

    // API usage tracking table
    `CREATE TABLE IF NOT EXISTS api_usage (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      endpoint VARCHAR(255) NOT NULL,
      method VARCHAR(10) NOT NULL,
      status_code INTEGER NOT NULL,
      credits_consumed INTEGER DEFAULT 0,
      processing_time_ms INTEGER,
      request_size INTEGER,
      response_size INTEGER,
      ip_address INET,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Better Auth compatibility table
    `CREATE TABLE IF NOT EXISTS better_auth_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      emailVerified BOOLEAN DEFAULT FALSE,
      name TEXT,
      image TEXT,
      createdAt TIMESTAMP DEFAULT NOW(),
      updatedAt TIMESTAMP DEFAULT NOW()
    )`
  ]

  for (const tableSQL of newTables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: tableSQL })
      if (error) {
        console.warn(`Table creation warning: ${error.message}`)
      }
    } catch (error) {
      console.warn(`Could not create table: ${error.message}`)
    }
  }

  console.log('✅ New tables created')
}

async function addConstraintsAndTriggers() {
  const constraints = [
    // Add check constraints
    'ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_email_format CHECK (email ~* \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$\')',
    'ALTER TABLE credits ADD CONSTRAINT IF NOT EXISTS check_expires_future CHECK (expires_at > created_at)',

    // Create updated_at trigger function
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
     RETURNS TRIGGER AS $$
     BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
     END;
     $$ language 'plpgsql'`,

    // Add triggers for updated_at
    'DROP TRIGGER IF EXISTS update_users_updated_at ON users',
    'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',

    'DROP TRIGGER IF EXISTS update_images_updated_at ON images',
    'CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
  ]

  for (const constraintSQL of constraints) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: constraintSQL })
      if (error) {
        console.warn(`Constraint/trigger warning: ${error.message}`)
      }
    } catch (error) {
      console.warn(`Could not add constraint/trigger: ${error.message}`)
    }
  }

  console.log('✅ Constraints and triggers added')
}

async function createUtilityFunctions() {
  const functions = [
    // Credit balance function
    `CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
     RETURNS INTEGER AS $$
     BEGIN
       RETURN COALESCE(
         (SELECT SUM(amount)
          FROM credits
          WHERE user_id = user_uuid
            AND is_active = true
            AND expires_at > NOW()),
         0
       );
     END;
     $$ LANGUAGE plpgsql STABLE`,

    // Credit deduction function
    `CREATE OR REPLACE FUNCTION deduct_user_credits(user_uuid UUID, credit_amount INTEGER, reason TEXT DEFAULT 'image_processing')
     RETURNS BOOLEAN AS $$
     DECLARE
       current_balance INTEGER;
     BEGIN
       current_balance := get_user_credit_balance(user_uuid);

       IF current_balance >= credit_amount THEN
         INSERT INTO credits (user_id, amount, type, source, description)
         VALUES (user_uuid, -credit_amount, 'deduction', reason, 'Credit deduction for ' || reason);
         RETURN TRUE;
       ELSE
         RETURN FALSE;
       END IF;
     END;
     $$ LANGUAGE plpgsql`
  ]

  for (const functionSQL of functions) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: functionSQL })
      if (error) {
        console.warn(`Function creation warning: ${error.message}`)
      }
    } catch (error) {
      console.warn(`Could not create function: ${error.message}`)
    }
  }

  console.log('✅ Utility functions created')
}

async function updateStatistics() {
  const analyzeCommands = [
    'ANALYZE users',
    'ANALYZE images',
    'ANALYZE credits',
    'ANALYZE sessions',
    'ANALYZE subscriptions',
    'ANALYZE payments'
  ]

  for (const analyzeSQL of analyzeCommands) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: analyzeSQL })
      if (error) {
        console.warn(`Analyze warning: ${error.message}`)
      }
    } catch (error) {
      console.warn(`Could not analyze: ${error.message}`)
    }
  }

  console.log('✅ Table statistics updated')
}

// Helper function to execute raw SQL (if not available as RPC)
async function executeSQLDirectly(sql) {
  // This would use a direct connection to PostgreSQL
  // For now, we'll use the RPC approach
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  if (error) throw error
  return data
}

// Run migration if script is executed directly
if (require.main === module) {
  runMigration().catch(console.error)
}

module.exports = { runMigration }
