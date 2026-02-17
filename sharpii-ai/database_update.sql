-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NOW();

-- Update the existing users table schema
-- This will ensure all required columns exist for the admin system-- Function to immediately expire all active subscription credits for a user
CREATE OR REPLACE FUNCTION expire_user_subscription_credits(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark all active subscription credit batches as expired
  UPDATE credits
  SET expires_at = NOW()
  WHERE user_id = p_user_id
    AND type = 'subscription'
    AND expires_at > NOW();
END;
$$;
