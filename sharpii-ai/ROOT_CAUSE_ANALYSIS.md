# 🔍 Root Cause Analysis: Credits Not Being Allocated

## Problem Summary

**Issue**: Credits are not being allocated after successful payments, despite previous fixes for duplicate credits.

**Status**: ✅ **ROOT CAUSE IDENTIFIED**

---

## 🎯 Root Cause

The database has **duplicate versions** of the `add_credits_atomic` function with different parameter types for `p_subscription_id`:

1. **Version 1**: `p_subscription_id => TEXT`
2. **Version 2**: `p_subscription_id => UUID`

When the webhook handler tries to call this function, PostgreSQL cannot determine which version to use, resulting in the error:

```
Could not choose the best candidate function between:
  public.add_credits_atomic(..., p_subscription_id => text, ...)
  public.add_credits_atomic(..., p_subscription_id => uuid, ...)
```

This causes the credit allocation to **silently fail**, leaving payments in an "orphaned" state where:
- ✅ Payment is recorded in the `payments` table
- ❌ No credits are added to the `credits` table
- ❌ User balance remains at 0

---

## 📊 Evidence

### Orphaned Payment Found

**Payment ID**: `pay_0NYd4TJnvc0Y42e4HmUky`
**User ID**: `d489bccf-a6fa-4746-a093-e8bf3c4c12d6`
**Email**: `test_payment_flow_1739718426000@example.com`
**Plan**: Creator (monthly)
**Amount**: ₹2,784.66 (278466 INR)
**Status**: Succeeded
**Credits Allocated**: 0 ❌

### Debug Output

```bash
$ npx tsx scripts/debug-credits.ts d489bccf-a6fa-4746-a093-e8bf3c4c12d6

User: {
  subscription_credits: 0,
  permanent_credits: 0,
  total: 0
}

Found 1 payments:
  1. pay_0NYd4TJnvc0Y42e4HmUky - creator - succeeded - 278466 INR

Found 0 credit records

⚠️ Found 1 payments without credits:
  - pay_0NYd4TJnvc0Y42e4HmUky (creator, 278466 INR)
```

---

## 🔧 Solution

### Step 1: Apply Database Migration

Run the following SQL in your **Supabase SQL Editor**:

**Location**: `data/db/migrations/20260216_fix_duplicate_functions.sql`

```sql
-- Drop all versions of the function
DROP FUNCTION IF EXISTS add_credits_atomic(uuid, integer, text, text, text, timestamptz, text, jsonb);
DROP FUNCTION IF EXISTS add_credits_atomic(uuid, integer, text, text, uuid, timestamptz, text, jsonb);

-- Recreate with TEXT subscription_id (more flexible)
CREATE OR REPLACE FUNCTION add_credits_atomic(
    p_user_id UUID,
    p_amount INTEGER,
    p_credit_type TEXT,
    p_transaction_id TEXT,
    p_subscription_id TEXT,  -- ← Changed to TEXT
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
    -- Check for existing credit (idempotency)
    SELECT id INTO v_existing_credit_id
    FROM credits
    WHERE user_id = p_user_id 
    AND transaction_id = p_transaction_id
    AND transaction_id IS NOT NULL
    LIMIT 1;

    IF v_existing_credit_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'duplicate', true,
            'credit_id', v_existing_credit_id,
            'message', 'Credit already granted for this transaction'
        );
    END IF;

    -- Convert subscription_id to UUID if valid, otherwise NULL
    BEGIN
        IF p_subscription_id IS NOT NULL AND p_subscription_id != '' THEN
            v_subscription_uuid := p_subscription_id::UUID;
        ELSE
            v_subscription_uuid := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_subscription_uuid := NULL;
    END;

    -- Insert credit record
    INSERT INTO credits (
        user_id, amount, type, credit_type, source,
        transaction_id, subscription_id, expires_at,
        is_active, description, metadata, created_at
    ) VALUES (
        p_user_id, p_amount, 'subscription', p_credit_type, 'payment',
        p_transaction_id, v_subscription_uuid, p_expires_at,
        true, p_description, p_metadata, now()
    )
    RETURNING id INTO v_new_credit_id;

    -- Update user balance
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
        user_id, amount, type, reason, description, metadata, created_at
    ) VALUES (
        p_user_id, p_amount, 'credit', 'subscription_payment',
        p_description, p_metadata || jsonb_build_object('credit_id', v_new_credit_id), now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'duplicate', false,
        'credit_id', v_new_credit_id,
        'message', 'Credits added successfully'
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_credits_atomic TO authenticated, anon, service_role;
```

**How to apply**:
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Paste the entire SQL above
3. Click "Run"
4. Verify success

---

### Step 2: Fix Orphaned Payments

After applying the migration, allocate credits for orphaned payments:

```bash
# Fix the specific orphaned payment
npx tsx scripts/fix-orphaned-payment.ts pay_0NYd4TJnvc0Y42e4HmUky

# Verify credits were allocated
npx tsx scripts/debug-credits.ts d489bccf-a6fa-4746-a093-e8bf3c4c12d6
```

---

### Step 3: Find and Fix All Orphaned Payments

Create a script to find all orphaned payments:

```bash
# Get list of all users
npx tsx scripts/get-user-id.ts

# For each user with 0 credits, check for orphaned payments
npx tsx scripts/debug-credits.ts <user-id>

# Fix any orphaned payments found
npx tsx scripts/fix-orphaned-payment.ts <payment-id>
```

---

## 🧪 Testing

### 1. Verify the Fix

```bash
# Check webhook health
npx tsx scripts/check-webhook.ts

# Should show:
# ✅ add_credits_atomic - EXISTS (only one version)
```

### 2. Test New Payment

```bash
# Update test webhook script with a real user ID
# Edit scripts/test-webhook.ts and replace YOUR_USER_ID_HERE

# Run test
npx tsx scripts/test-webhook.ts

# Verify credits allocated
npx tsx scripts/debug-credits.ts <user-id>
```

### 3. Make Real Payment

1. Make a test payment through your app
2. Watch terminal logs for:
   ```
   🔔 Webhook received
   💳 Processing payment.succeeded
   ✅ Credits allocated successfully
   ```
3. Verify in database:
   ```bash
   npx tsx scripts/debug-credits.ts <user-id>
   # Should show credits > 0
   # Should show NO orphaned payments
   ```

---

## 📋 Prevention

To prevent this issue in the future:

### 1. Migration Best Practices

When modifying database functions:
```sql
-- Always drop existing versions first
DROP FUNCTION IF EXISTS function_name(param_types);

-- Then create new version
CREATE OR REPLACE FUNCTION function_name(...) ...
```

### 2. Monitor for Orphaned Payments

Run this check regularly:
```bash
# Check all recent users
npx tsx scripts/get-user-id.ts

# For users with 0 credits, check for orphaned payments
npx tsx scripts/debug-credits.ts <user-id>
```

### 3. Webhook Monitoring

Add alerting for webhook failures:
- Monitor webhook logs for errors
- Set up alerts for payments without corresponding credits
- Check Dodo Payments webhook delivery status

---

## 🎯 Success Criteria

✅ **Fix is successful when**:

1. **Migration Applied**
   - Only ONE version of `add_credits_atomic` exists
   - Function accepts TEXT for `p_subscription_id`

2. **Orphaned Payments Fixed**
   - All existing orphaned payments have credits allocated
   - User balances reflect all successful payments

3. **New Payments Work**
   - Test payment results in credits being allocated
   - No errors in webhook logs
   - Credits appear in user balance immediately

4. **No Duplicates**
   - Same payment ID cannot create multiple credit records
   - Webhook retries don't cause duplicate credits

---

## 📁 Related Files

### Scripts Created
- `scripts/debug-credits.ts` - Debug user credits and find orphaned payments
- `scripts/fix-orphaned-payment.ts` - Manually allocate credits for orphaned payments
- `scripts/get-user-id.ts` - Look up user IDs by email
- `scripts/check-webhook.ts` - Health check for webhook system
- `scripts/test-webhook.ts` - Test webhook locally
- `scripts/apply-migration.ts` - Apply database migrations

### Migrations
- `data/db/migrations/20260216_fix_billing_system.sql` - Original billing system migration
- `data/db/migrations/20260216_fix_duplicate_functions.sql` - **NEW** - Fixes duplicate functions

### Documentation
- `CREDIT_DEBUG_GUIDE.md` - Comprehensive debugging guide
- `TESTING_GUIDE.md` - Testing procedures
- `ROOT_CAUSE_ANALYSIS.md` - **THIS FILE**

---

## 🔗 Quick Reference

```bash
# Health check
npx tsx scripts/check-webhook.ts

# Find users
npx tsx scripts/get-user-id.ts [email]

# Debug user credits
npx tsx scripts/debug-credits.ts <user-id>

# Fix orphaned payment
npx tsx scripts/fix-orphaned-payment.ts <payment-id>

# Test webhook
npx tsx scripts/test-webhook.ts
```

---

**Last Updated**: 2024-02-16
**Status**: Ready to fix - migration SQL provided
**Next Action**: Apply migration in Supabase SQL Editor
