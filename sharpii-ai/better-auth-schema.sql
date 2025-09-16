-- Better Auth Schema for Supabase
-- This schema creates the necessary tables for Better Auth

-- Users table (extends existing or creates new)
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "subscriptionStatus" TEXT DEFAULT 'free',
    "apiUsage" INTEGER DEFAULT 0,
    "monthlyApiLimit" INTEGER DEFAULT 100
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "token" TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- Accounts table (for social providers)
CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP,
    "tokenType" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("provider", "providerAccountId")
);

-- Verification table (for email verification)
CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_token" ON "session"("token");
CREATE INDEX IF NOT EXISTS "idx_account_userId" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "idx_account_provider" ON "account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "idx_verification_identifier" ON "verification"("identifier");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "user"("email");

-- Enable Row Level Security (RLS)
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON "user"
    FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON "user"
    FOR UPDATE USING (auth.uid()::text = id);

-- Allow service role to manage all data
CREATE POLICY "Service role can manage all users" ON "user"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all sessions" ON "session"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all accounts" ON "account"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all verifications" ON "verification"
    FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions" ON "session"
    FOR SELECT USING (userId = auth.uid()::text);

-- Users can read their own accounts
CREATE POLICY "Users can read own accounts" ON "account"
    FOR SELECT USING (userId = auth.uid()::text);