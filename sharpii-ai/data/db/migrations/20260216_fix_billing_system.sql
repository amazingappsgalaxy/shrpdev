-- Fix Billing System: Prevent Duplicate Credits & Implement Expiry Logic
-- Migration: 20260216_fix_billing_system

-- 1. Add unique constraint to payments table to prevent duplicate processing
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_dodo_payment_id_key;
ALTER TABLE payments ADD CONSTRAINT payments_dodo_payment_id_key UNIQUE (dodo_payment_id);

-- 2. Add columns to users table for credit separation
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permanent_credits INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_credits_expire_at TIMESTAMPTZ;

-- 3. Update credits table to track credit type and expiry
ALTER TABLE credits ADD COLUMN IF NOT EXISTS credit_type TEXT DEFAULT 'subscription' CHECK (credit_type IN ('subscription', 'permanent'));

-- 4. Add unique constraint to prevent duplicate credit grants per payment
CREATE UNIQUE INDEX IF NOT EXISTS idx_credits_unique_payment 
ON credits(user_id, transaction_id) 
WHERE transaction_id IS NOT NULL;

-- 5. Create function to atomically add credits with idempotency
CREATE OR REPLACE FUNCTION add_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_credit_type TEXT,
    p_transaction_id TEXT,
    p_subscription_id UUID,
    p_expires_at TIMESTAMPTZ,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_credit_id UUID;
    v_new_credit_id UUID;
BEGIN
    -- Check if credit already exists for this transaction (idempotency)
    SELECT id INTO v_existing_credit_id
    FROM credits
    WHERE user_id = p_user_id 
    AND transaction_id = p_transaction_id
    AND transaction_id IS NOT NULL
    LIMIT 1;

    IF v_existing_credit_id IS NOT NULL THEN
        -- Credit already granted, return existing
        RETURN jsonb_build_object(
            'success', true,
            'duplicate', true,
            'credit_id', v_existing_credit_id,
            'message', 'Credit already granted for this transaction'
        );
    END IF;

    -- Insert new credit record
    INSERT INTO credits (
        user_id,
        amount,
        type,
        credit_type,
        source,
        transaction_id,
        subscription_id,
        expires_at,
        is_active,
        description,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        p_amount,
        'subscription',
        p_credit_type,
        'payment',
        p_transaction_id,
        p_subscription_id,
        p_expires_at,
        true,
        p_description,
        p_metadata,
        now()
    )
    RETURNING id INTO v_new_credit_id;

    -- Update user's credit balance based on type
    IF p_credit_type = 'subscription' THEN
        UPDATE users 
        SET 
            subscription_credits = COALESCE(subscription_credits, 0) + p_amount,
            subscription_credits_expire_at = p_expires_at,
            updated_at = now()
        WHERE id = p_user_id;
    ELSE
        UPDATE users 
        SET 
            permanent_credits = COALESCE(permanent_credits, 0) + p_amount,
            updated_at = now()
        WHERE id = p_user_id;
    END IF;

    -- Record transaction
    INSERT INTO credit_transactions (
        user_id,
        amount,
        type,
        reason,
        description,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        p_amount,
        'credit',
        'subscription_payment',
        p_description,
        p_metadata || jsonb_build_object('credit_id', v_new_credit_id),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'duplicate', false,
        'credit_id', v_new_credit_id,
        'message', 'Credits added successfully'
    );
END;
$$;

-- 6. Create function to deduct credits with hierarchy (subscription first, then permanent)
CREATE OR REPLACE FUNCTION deduct_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_task_id TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_credits INTEGER;
    v_permanent_credits INTEGER;
    v_total_available INTEGER;
    v_from_subscription INTEGER := 0;
    v_from_permanent INTEGER := 0;
    v_balance_before INTEGER;
    v_balance_after INTEGER;
BEGIN
    -- Get current credit balances
    SELECT 
        COALESCE(subscription_credits, 0),
        COALESCE(permanent_credits, 0)
    INTO v_subscription_credits, v_permanent_credits
    FROM users
    WHERE id = p_user_id
    FOR UPDATE; -- Lock row to prevent race conditions

    v_total_available := v_subscription_credits + v_permanent_credits;
    v_balance_before := v_total_available;

    -- Check if user has enough credits
    IF v_total_available < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'available', v_total_available,
            'required', p_amount
        );
    END IF;

    -- Calculate deduction hierarchy: subscription credits first
    IF v_subscription_credits >= p_amount THEN
        -- Deduct entirely from subscription credits
        v_from_subscription := p_amount;
    ELSE
        -- Deduct all subscription credits, rest from permanent
        v_from_subscription := v_subscription_credits;
        v_from_permanent := p_amount - v_subscription_credits;
    END IF;

    -- Update user credits
    UPDATE users
    SET
        subscription_credits = subscription_credits - v_from_subscription,
        permanent_credits = permanent_credits - v_from_permanent,
        updated_at = now()
    WHERE id = p_user_id;

    v_balance_after := v_balance_before - p_amount;

    -- Record transaction
    INSERT INTO credit_transactions (
        user_id,
        amount,
        type,
        reason,
        description,
        balance_before,
        balance_after,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        -p_amount,
        'debit',
        'image_enhancement',
        p_description,
        v_balance_before,
        v_balance_after,
        p_metadata || jsonb_build_object(
            'task_id', p_task_id,
            'from_subscription', v_from_subscription,
            'from_permanent', v_from_permanent
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'deducted', p_amount,
        'from_subscription', v_from_subscription,
        'from_permanent', v_from_permanent,
        'balance_after', v_balance_after
    );
END;
$$;

-- 7. Create function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_credits INTEGER;
    v_permanent_credits INTEGER;
    v_expire_at TIMESTAMPTZ;
    v_total INTEGER;
BEGIN
    SELECT 
        COALESCE(subscription_credits, 0),
        COALESCE(permanent_credits, 0),
        subscription_credits_expire_at
    INTO v_subscription_credits, v_permanent_credits, v_expire_at
    FROM users
    WHERE id = p_user_id;

    v_total := v_subscription_credits + v_permanent_credits;

    RETURN jsonb_build_object(
        'total', v_total,
        'subscription_credits', v_subscription_credits,
        'permanent_credits', v_permanent_credits,
        'subscription_expire_at', v_expire_at
    );
END;
$$;

-- 8. Create function to expire old subscription credits
CREATE OR REPLACE FUNCTION expire_subscription_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired_count INTEGER := 0;
BEGIN
    -- Reset expired subscription credits to 0
    UPDATE users
    SET 
        subscription_credits = 0,
        subscription_credits_expire_at = NULL,
        updated_at = now()
    WHERE subscription_credits_expire_at < now()
    AND subscription_credits > 0;

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    -- Mark credits as inactive
    UPDATE credits
    SET is_active = false
    WHERE expires_at < now()
    AND is_active = true
    AND credit_type = 'subscription';

    RETURN v_expired_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_credits_atomic TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION deduct_credits_atomic TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_user_credits TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION expire_subscription_credits TO service_role;

-- Create index for faster credit lookups
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(subscription_credits, permanent_credits);
CREATE INDEX IF NOT EXISTS idx_credits_expiry ON credits(expires_at, is_active) WHERE credit_type = 'subscription';
