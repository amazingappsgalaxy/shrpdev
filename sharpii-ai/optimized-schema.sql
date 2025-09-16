-- Optimized Supabase Schema for Sharpii.ai
-- This schema includes performance optimizations, better constraints, and proper indexing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- Users table with optimizations
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) >= 2),
    password_hash VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'free' CHECK (subscription_status IN ('free', 'basic', 'creator', 'professional', 'enterprise')),
    subscription_id UUID,
    total_credits_purchased INTEGER DEFAULT 0 CHECK (total_credits_purchased >= 0),
    total_images_processed INTEGER DEFAULT 0 CHECK (total_images_processed >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb,

    -- Computed columns for performance
    credits_balance INTEGER GENERATED ALWAYS AS (
        COALESCE((SELECT SUM(amount) FROM credits WHERE user_id = users.id AND is_active = true AND expires_at > NOW()), 0)
    ) STORED
);

-- Better Auth compatibility table
CREATE TABLE IF NOT EXISTS better_auth_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    emailVerified BOOLEAN DEFAULT FALSE,
    name TEXT,
    image TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- Sessions table with better indexing
DROP TABLE IF EXISTS sessions CASCADE;
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > created_at),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    is_active BOOLEAN DEFAULT TRUE
);

-- Enhanced images table
DROP TABLE IF EXISTS images CASCADE;
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- File information
    original_url TEXT NOT NULL,
    enhanced_url TEXT,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    width INTEGER NOT NULL CHECK (width > 0),
    height INTEGER NOT NULL CHECK (height > 0),
    mime_type VARCHAR(50) DEFAULT 'image/jpeg',

    -- Processing information
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    enhancement_type VARCHAR(100),
    model_used VARCHAR(100),
    provider_used VARCHAR(50),
    processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
    credits_consumed INTEGER DEFAULT 0 CHECK (credits_consumed >= 0),

    -- Metadata
    enhancement_settings JSONB DEFAULT '{}'::jsonb,
    processing_metadata JSONB DEFAULT '{}'::jsonb,
    error_details TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Quality metrics
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 10),
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5)
);

-- Enhanced enhancement_tasks table
CREATE TABLE IF NOT EXISTS enhancement_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,

    -- Task details
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),

    -- Processing details
    provider VARCHAR(50),
    model_id VARCHAR(100),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_completion TIMESTAMPTZ,

    -- Results
    result_url TEXT,
    processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
    credits_consumed INTEGER DEFAULT 0 CHECK (credits_consumed >= 0),
    error_message TEXT,

    -- Metadata
    request_data JSONB DEFAULT '{}'::jsonb,
    response_data JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Optimized subscriptions table
DROP TABLE IF EXISTS subscriptions CASCADE;
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Plan details
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('basic', 'creator', 'professional', 'enterprise')),
    billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'paused')),

    -- Billing information
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',

    -- Dates
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- External service IDs
    dodo_customer_id VARCHAR(255),
    dodo_subscription_id VARCHAR(255),
    dodo_payment_method_id VARCHAR(255),

    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (end_date IS NULL OR end_date > start_date),
    CHECK (next_billing_date IS NULL OR next_billing_date > start_date),
    UNIQUE(user_id, dodo_subscription_id)
);

-- Optimized credits table
DROP TABLE IF EXISTS credits CASCADE;
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Credit details
    amount INTEGER NOT NULL, -- Can be negative for deductions
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'bonus', 'refund', 'subscription', 'deduction')),
    source VARCHAR(100) NOT NULL,

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    is_active BOOLEAN DEFAULT TRUE,

    -- Transaction details
    transaction_id VARCHAR(255),
    description TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Balance tracking
    balance_before INTEGER,
    balance_after INTEGER,

    -- Constraints
    CHECK (expires_at > created_at)
);

-- Enhanced payments table
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Payment details
    dodo_payment_id VARCHAR(255) UNIQUE NOT NULL,
    dodo_customer_id VARCHAR(255),
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status and method
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method VARCHAR(50),

    -- Plan information
    plan VARCHAR(50) CHECK (plan IN ('basic', 'creator', 'professional', 'enterprise')),
    billing_period VARCHAR(20) CHECK (billing_period IN ('monthly', 'yearly')),

    -- Metadata
    payment_metadata JSONB DEFAULT '{}'::jsonb,
    webhook_data JSONB DEFAULT '{}'::jsonb,

    -- Failure information
    failure_reason TEXT,
    failure_code VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Refund information
    refunded_at TIMESTAMPTZ,
    refund_amount INTEGER DEFAULT 0 CHECK (refund_amount >= 0),
    refund_reason TEXT
);

-- User activity for analytics
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Activity details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- 'image', 'subscription', 'payment', etc.
    resource_id UUID,

    -- Context
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,

    -- Performance tracking
    duration_ms INTEGER CHECK (duration_ms >= 0),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- API details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,

    -- Usage details
    credits_consumed INTEGER DEFAULT 0,
    processing_time_ms INTEGER,

    -- Request details
    request_size INTEGER,
    response_size INTEGER,
    ip_address INET,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
-- Users table indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_subscription_status ON users(subscription_status);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY idx_users_active ON users(is_active) WHERE is_active = true;

-- Sessions table indexes
CREATE INDEX CONCURRENTLY idx_sessions_user_id ON sessions(user_id);
CREATE INDEX CONCURRENTLY idx_sessions_token ON sessions(token);
CREATE INDEX CONCURRENTLY idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX CONCURRENTLY idx_sessions_active ON sessions(user_id, is_active) WHERE is_active = true;

-- Images table indexes
CREATE INDEX CONCURRENTLY idx_images_user_id ON images(user_id);
CREATE INDEX CONCURRENTLY idx_images_status ON images(status);
CREATE INDEX CONCURRENTLY idx_images_created_at ON images(created_at DESC);
CREATE INDEX CONCURRENTLY idx_images_user_status ON images(user_id, status);
CREATE INDEX CONCURRENTLY idx_images_processing ON images(status) WHERE status IN ('pending', 'processing');

-- Enhancement tasks indexes
CREATE INDEX CONCURRENTLY idx_enhancement_tasks_user_id ON enhancement_tasks(user_id);
CREATE INDEX CONCURRENTLY idx_enhancement_tasks_status ON enhancement_tasks(status);
CREATE INDEX CONCURRENTLY idx_enhancement_tasks_created_at ON enhancement_tasks(created_at DESC);
CREATE INDEX CONCURRENTLY idx_enhancement_tasks_priority ON enhancement_tasks(priority DESC, created_at);

-- Subscriptions table indexes
CREATE INDEX CONCURRENTLY idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX CONCURRENTLY idx_subscriptions_status ON subscriptions(status);
CREATE INDEX CONCURRENTLY idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_subscriptions_dodo_id ON subscriptions(dodo_subscription_id);

-- Credits table indexes
CREATE INDEX CONCURRENTLY idx_credits_user_id ON credits(user_id);
CREATE INDEX CONCURRENTLY idx_credits_active ON credits(user_id, is_active, expires_at) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_credits_expires_at ON credits(expires_at);
CREATE INDEX CONCURRENTLY idx_credits_type ON credits(type);

-- Payments table indexes
CREATE INDEX CONCURRENTLY idx_payments_user_id ON payments(user_id);
CREATE INDEX CONCURRENTLY idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY idx_payments_dodo_payment_id ON payments(dodo_payment_id);
CREATE INDEX CONCURRENTLY idx_payments_created_at ON payments(created_at DESC);

-- User activity indexes
CREATE INDEX CONCURRENTLY idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX CONCURRENTLY idx_user_activity_action ON user_activity(action);
CREATE INDEX CONCURRENTLY idx_user_activity_created_at ON user_activity(created_at DESC);

-- API usage indexes
CREATE INDEX CONCURRENTLY idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX CONCURRENTLY idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX CONCURRENTLY idx_api_usage_endpoint ON api_usage(endpoint);

-- Triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enhancement_tasks_updated_at BEFORE UPDATE ON enhancement_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Utility functions
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
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
$$ LANGUAGE plpgsql STABLE;

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_user_credits(user_uuid UUID, credit_amount INTEGER, reason TEXT DEFAULT 'image_processing')
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
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id::text);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id::text);

-- RLS Policies for images table
CREATE POLICY "Users can view their own images" ON images FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can insert their own images" ON images FOR INSERT WITH CHECK (auth.uid() = user_id::text);
CREATE POLICY "Users can update their own images" ON images FOR UPDATE USING (auth.uid() = user_id::text);

-- Performance optimizations
-- Analyze tables for better query planning
ANALYZE users;
ANALYZE sessions;
ANALYZE images;
ANALYZE enhancement_tasks;
ANALYZE subscriptions;
ANALYZE credits;
ANALYZE payments;
ANALYZE user_activity;

-- Create materialized view for user statistics
CREATE MATERIALIZED VIEW user_statistics AS
SELECT
    u.id,
    u.email,
    u.subscription_status,
    COUNT(DISTINCT i.id) as total_images,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'completed') as completed_images,
    COALESCE(SUM(i.credits_consumed), 0) as total_credits_used,
    get_user_credit_balance(u.id) as current_credit_balance,
    u.created_at,
    MAX(i.created_at) as last_image_upload
FROM users u
LEFT JOIN images i ON u.id = i.user_id
WHERE u.is_active = true
GROUP BY u.id, u.email, u.subscription_status, u.created_at;

-- Index for the materialized view
CREATE UNIQUE INDEX idx_user_statistics_id ON user_statistics(id);
CREATE INDEX idx_user_statistics_subscription ON user_statistics(subscription_status);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_statistics;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE sessions IS 'User session management';
COMMENT ON TABLE images IS 'Uploaded and processed images';
COMMENT ON TABLE enhancement_tasks IS 'Image enhancement processing tasks';
COMMENT ON TABLE subscriptions IS 'User subscription plans and billing';
COMMENT ON TABLE credits IS 'User credit balance and transactions';
COMMENT ON TABLE payments IS 'Payment processing records';
COMMENT ON TABLE user_activity IS 'User action tracking for analytics';
COMMENT ON MATERIALIZED VIEW user_statistics IS 'Aggregated user statistics for dashboard';

-- Grant permissions (adjust based on your needs)
-- These would be customized based on your actual roles and security requirements
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;