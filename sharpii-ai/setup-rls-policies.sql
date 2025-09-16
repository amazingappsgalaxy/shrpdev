-- Setup Row Level Security (RLS) policies for credits system

-- Enable RLS on credits table if not already enabled
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on credit_transactions table if not already enabled
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own credits" ON credits;
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service role can manage all credits" ON credits;
DROP POLICY IF EXISTS "Service role can manage all credit transactions" ON credit_transactions;

-- Policy 1: Users can view their own credits
CREATE POLICY "Users can view their own credits" ON credits
    FOR SELECT
    USING (
        auth.uid()::text = user_id
        OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy 2: Users can view their own credit transactions
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT
    USING (
        auth.uid()::text = user_id
        OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy 3: Service role can insert/update credits (for webhooks and admin operations)
CREATE POLICY "Service role can manage all credits" ON credits
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy 4: Service role can insert/update credit transactions (for webhooks and admin operations)
CREATE POLICY "Service role can manage all credit transactions" ON credit_transactions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON credits TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;
GRANT ALL ON credits TO service_role;
GRANT ALL ON credit_transactions TO service_role;