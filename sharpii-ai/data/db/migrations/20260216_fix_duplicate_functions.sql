-- Fix duplicate add_credits_atomic functions
-- Migration: 20260216_fix_duplicate_functions

-- Drop all versions of the function
DROP FUNCTION IF EXISTS add_credits_atomic(uuid, integer, text, text, text, timestamptz, text, jsonb);
DROP FUNCTION IF EXISTS add_credits_atomic(uuid, integer, text, text, uuid, timestamptz, text, jsonb);

-- Recreate the function with the correct signature
-- Using TEXT for subscription_id to handle both subscription IDs and NULL values
CREATE OR REPLACE FUNCTION add_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_credit_type TEXT,
    p_transaction_id TEXT,
    p_subscription_id TEXT,  -- Changed to TEXT to be more flexible
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
    v_subscription_uuid UUID;
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

    -- Convert subscription_id to UUID if it's a valid UUID string, otherwise NULL
    BEGIN
        IF p_subscription_id IS NOT NULL AND p_subscription_id != '' THEN
            v_subscription_uuid := p_subscription_id::UUID;
        ELSE
            v_subscription_uuid := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If conversion fails, set to NULL
        v_subscription_uuid := NULL;
    END;

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
        v_subscription_uuid,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_credits_atomic TO authenticated, anon, service_role;

-- Verify the function exists
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'add_credits_atomic';
