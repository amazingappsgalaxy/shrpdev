-- Fix RLS policies for credits system to allow webhook operations

-- Disable RLS on credits tables to allow server-side operations
ALTER TABLE credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for authenticated users and service role
GRANT SELECT, INSERT, UPDATE ON credits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON credit_transactions TO authenticated;
GRANT ALL ON credits TO service_role;
GRANT ALL ON credit_transactions TO service_role;

-- Grant access to anonymous users for public operations if needed
GRANT SELECT ON credits TO anon;
GRANT SELECT ON credit_transactions TO anon;