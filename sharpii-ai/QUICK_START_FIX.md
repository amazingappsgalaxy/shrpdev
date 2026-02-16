# 🚀 Quick Start: Fixing Credit Allocation Issues

## TL;DR - The Fix

Your billing system has a database function conflict causing credits not to be allocated. Here's how to fix it:

### ⚡ Quick Fix (5 minutes)

1. **Apply the migration** (copy SQL from below and run in Supabase)
2. **Fix orphaned payments** (run the script)
3. **Test** (make a payment and verify credits)

---

## Step 1: Apply Database Migration ⚙️

### Option A: Via Supabase Dashboard (Recommended)

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy the entire SQL from: `data/db/migrations/20260216_fix_duplicate_functions.sql`
3. Paste and click "Run"
4. Wait for success message

### Option B: Quick Copy-Paste

```sql
-- Drop duplicate functions
DROP FUNCTION IF EXISTS add_credits_atomic(uuid, integer, text, text, text, timestamptz, text, jsonb);
DROP FUNCTION IF EXISTS add_credits_atomic(uuid, integer, text, text, uuid, timestamptz, text, jsonb);

-- Recreate with correct signature
-- (See full SQL in data/db/migrations/20260216_fix_duplicate_functions.sql)
```

**Verify migration worked:**
```bash
npx tsx scripts/check-webhook.ts
# Should show: ✅ add_credits_atomic - EXISTS
```

---

## Step 2: Fix Existing Orphaned Payments 🔧

### Check for orphaned payments:

```bash
# Dry run - see what would be fixed
npx tsx scripts/fix-all-orphaned-payments.ts --dry-run
```

### Fix all orphaned payments:

```bash
# Actually fix them (waits 5 seconds for confirmation)
npx tsx scripts/fix-all-orphaned-payments.ts
```

**Expected output:**
```
⚠️  Found 1 orphaned payments:

1. pay_0NYd4TJnvc0Y42e4HmUky
   User: test@example.com
   Plan: creator (monthly)
   Amount: 278466 INR

🔧 Fixing orphaned payments...
[1/1] pay_0NYd4TJnvc0Y42e4HmUky
   ✅ Credits allocated

📊 Summary:
   ✅ Fixed: 1
```

---

## Step 3: Verify Everything Works ✅

### Test 1: Check user credits

```bash
# List all users
npx tsx scripts/get-user-id.ts

# Check specific user
npx tsx scripts/debug-credits.ts <user-id>
```

**Expected output:**
```
User: {
  subscription_credits: 500,  # ← Should be > 0 now!
  permanent_credits: 0,
  total: 500
}

✅ All payments have corresponding credits
```

### Test 2: Make a new payment

1. Make a test payment through your app
2. Watch the Next.js terminal for logs:
   ```
   🔔 Webhook received
   💳 Processing payment.succeeded
   ✅ Credits allocated successfully
   ```
3. Verify credits immediately:
   ```bash
   npx tsx scripts/debug-credits.ts <user-id>
   ```

### Test 3: Check dashboard

1. Open http://localhost:3004/app/dashboard
2. Go to "Credits" tab
3. Should show:
   - ✅ Total credits (large number)
   - ✅ Subscription credits with expiry
   - ✅ Transaction history

---

## 🆘 Troubleshooting

### Issue: Migration fails

**Error**: `function add_credits_atomic does not exist`

**Fix**: The function might already be fixed. Run:
```bash
npx tsx scripts/check-webhook.ts
```

If it shows `✅ add_credits_atomic - EXISTS`, you're good!

---

### Issue: "Could not choose the best candidate function"

**Cause**: Migration not applied yet

**Fix**: Go back to Step 1 and apply the migration

---

### Issue: Orphaned payments still exist after fix

**Error**: `Failed to allocate credits`

**Check**:
1. Did you apply the migration? (Step 1)
2. Is the Next.js server running?
3. Check the error message in the output

**Manual fix**:
```bash
npx tsx scripts/fix-orphaned-payment.ts <payment-id>
```

---

### Issue: New payments still not allocating credits

**Check**:
1. Is webhook URL correct in Dodo dashboard?
   - Should be: `https://your-tunnel.trycloudflare.com/api/payments/webhook`
2. Is tunnel running?
   ```bash
   ps aux | grep cloudflared
   ```
3. Check webhook logs in Next.js terminal
4. Test webhook manually:
   ```bash
   npx tsx scripts/test-webhook.ts
   ```

---

## 📋 Complete Command Reference

```bash
# Health check
npx tsx scripts/check-webhook.ts

# Find users
npx tsx scripts/get-user-id.ts                    # List all users
npx tsx scripts/get-user-id.ts user@example.com   # Find by email

# Debug credits
npx tsx scripts/debug-credits.ts <user-id>

# Fix orphaned payments
npx tsx scripts/fix-all-orphaned-payments.ts --dry-run  # Preview
npx tsx scripts/fix-all-orphaned-payments.ts            # Actually fix

# Fix single payment
npx tsx scripts/fix-orphaned-payment.ts <payment-id>

# Test webhook
npx tsx scripts/test-webhook.ts
```

---

## ✅ Success Checklist

- [ ] Migration applied successfully
- [ ] `check-webhook.ts` shows function exists
- [ ] All orphaned payments fixed
- [ ] Test payment allocates credits
- [ ] Dashboard shows correct balance
- [ ] No errors in webhook logs

---

## 🎯 What Was Wrong?

The database had **two versions** of the `add_credits_atomic` function:
- One expecting `subscription_id` as TEXT
- One expecting `subscription_id` as UUID

PostgreSQL couldn't decide which to use, so credit allocation failed silently.

**The fix**: Drop both versions and recreate with TEXT (more flexible).

---

## 📚 More Information

- **Root Cause Analysis**: `ROOT_CAUSE_ANALYSIS.md`
- **Debugging Guide**: `CREDIT_DEBUG_GUIDE.md`
- **Testing Guide**: `TESTING_GUIDE.md`

---

## 🚨 Important Notes

1. **Backup first**: If you have production data, backup your database before applying migrations
2. **Test environment**: Test the fix in development before applying to production
3. **Monitor**: Watch webhook logs after deploying to ensure everything works
4. **Idempotency**: The fix is idempotent - running it multiple times won't create duplicate credits

---

**Need help?** Check the detailed guides or run the health check:
```bash
npx tsx scripts/check-webhook.ts
```

---

**Last Updated**: 2024-02-16
