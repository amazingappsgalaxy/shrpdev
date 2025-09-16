# Database Setup Instructions

## 🚨 URGENT: Database Tables Need Manual Creation

The application requires database tables to be created manually in the Supabase dashboard before authentication and other features will work.

## 📋 Steps to Set Up Database

### 1. Access Supabase Dashboard
- Go to: https://supabase.com/dashboard/project/ftndokqxuumwxsbwatbo/editor
- Login with your Supabase account

### 2. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Execute the Schema
Copy and paste the entire content from `supabase-schema.sql` file into the SQL editor and run it.

OR run these essential tables first:

```sql
-- Essential tables for authentication
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'free',
    api_usage INTEGER DEFAULT 0,
    monthly_api_limit INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- User Activity table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    enhanced_url TEXT,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    enhancement_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Enhancement Tasks table
CREATE TABLE IF NOT EXISTS enhancement_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_id VARCHAR(255) NOT NULL,
    original_image_url TEXT NOT NULL,
    enhanced_image_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    prompt TEXT,
    settings JSONB,
    model_id VARCHAR(255) NOT NULL,
    model_name VARCHAR(255),
    provider VARCHAR(100) NOT NULL,
    job_id VARCHAR(255),
    prediction_id VARCHAR(255),
    error_message TEXT,
    processing_time INTEGER,
    estimated_time INTEGER,
    credits_consumed INTEGER,
    task_tags JSONB,
    original_width INTEGER,
    original_height INTEGER,
    original_file_size BIGINT,
    original_file_format VARCHAR(20),
    output_width INTEGER,
    output_height INTEGER,
    output_file_size BIGINT,
    output_file_format VARCHAR(20),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    failed_at TIMESTAMPTZ,
    metadata JSONB
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    subscription_id UUID,
    transaction_id VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    billing_period VARCHAR(20),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    dodo_customer_id VARCHAR(255),
    dodo_subscription_id VARCHAR(255),
    dodo_payment_method_id VARCHAR(255),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_user_id ON enhancement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
```

### 4. Verify Tables Created
After running the SQL, you should see the following tables in your database:
- users
- sessions
- user_activity
- images
- enhancement_tasks
- credits
- subscriptions

## 🔄 After Database Setup

Once the tables are created:
1. Restart the development server: `npm run dev`
2. Test user registration at: http://localhost:3002/signup
3. Test user login at: http://localhost:3002/login
4. Access the dashboard at: http://localhost:3002/app/dashboard

## 🚨 Current Status

**BLOCKED**: Authentication, credits, billing, and enhancement features will not work until database tables are created.

**WORKING**: Frontend UI, routing, and static pages should work fine.

## 📞 Need Help?

If you encounter issues:
1. Check Supabase project settings
2. Verify the service key is correct
3. Ensure RLS (Row Level Security) policies are properly configured
4. Check the browser console for detailed error messages