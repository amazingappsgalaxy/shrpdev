# Credit Allocation Debugging Guide

## Problem: Credits Not Being Allocated After Payment

This guide will help you identify and fix issues where successful payments don't result in credits being added to user accounts.

---

## 🔍 Step 1: Identify Your User ID

First, you need to know which user to debug. You can find this by:

### Option A: Check the database
```sql
SELECT id, email FROM users WHERE email = 'your-email@example.com';
```

### Option B: Check the browser console
1. Open your app in the browser
2. Open DevTools (F12)
3. Go to Application > Cookies
4. Look for the session cookie and decode it

---

## 🧪 Step 2: Run the Debug Script

Once you have your user ID, run:

```bash
npx tsx scripts/debug-credits.ts <your-user-id>
```

This will show you:
- Current credit balance (subscription + permanent)
- All payments made
- All credit records
- All credit transactions
- **Orphaned payments** (payments without corresponding credits) ⚠️

### What to Look For:

#### ✅ Good State
```
User: {
  subscription_credits: 1000,
  permanent_credits: 0,
  total: 1000
}
Found 1 payments
Found 1 credit records
✅ All payments have corresponding credits
```

#### ❌ Problem State
```
User: {
  subscription_credits: 0,
  permanent_credits: 0,
  total: 0
}
Found 1 payments
Found 0 credit records
⚠️ Found 1 payments without credits:
  - pay_abc123 (professional, 2999 INR)
```

---

## 🔧 Step 3: Test Webhook Locally

If you found orphaned payments, test the webhook handler:

### 3.1 Update the test script
Edit `scripts/test-webhook.ts` and replace `YOUR_USER_ID_HERE` with your actual user ID.

### 3.2 Run the test
```bash
npx tsx scripts/test-webhook.ts
```

### 3.3 Watch the logs
In the terminal running Next.js (port 3004), you should see:
```
🔔 Webhook received at: 2024-...
📋 Event type: payment.succeeded
💳 Processing payment.succeeded: test_payment_...
👤 User: <user-id>, Plan: professional, Period: monthly
✅ Credits allocated successfully
```

### 3.4 Verify credits were added
Run the debug script again:
```bash
npx tsx scripts/debug-credits.ts <your-user-id>
```

You should now see credits!

---

## 🐛 Common Issues & Fixes

### Issue 1: Database Functions Not Found

**Symptom**: Error like `function add_credits_atomic does not exist`

**Fix**: Run the migration
```bash
# Check if migration file exists
ls data/db/migrations/20260216_fix_billing_system.sql

# Apply it manually via Supabase dashboard SQL editor
# Or use the Supabase CLI
```

**Verify**:
```sql
SELECT proname FROM pg_proc WHERE proname = 'add_credits_atomic';
```

---

### Issue 2: Missing User ID in Webhook

**Symptom**: Webhook logs show `❌ No userId found in payment metadata`

**Fix**: Ensure your payment flow includes the userId in metadata:
```javascript
// When creating payment
const payment = await dodoPayments.createPayment({
  amount: 2999,
  currency: 'INR',
  metadata: {
    userId: user.id,  // ← This is critical!
    plan: 'professional',
    billingPeriod: 'monthly'
  }
})
```

---

### Issue 3: Webhook Not Receiving Events

**Symptom**: No webhook logs in terminal when payment succeeds

**Check**:
1. Is the tunnel running?
   ```bash
   ps aux | grep cloudflared
   ```

2. Is the webhook URL correct in Dodo dashboard?
   - Should be: `https://your-tunnel-url.trycloudflare.com/api/payments/webhook`

3. Test webhook manually:
   ```bash
   curl -X POST http://localhost:3004/api/payments/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment.succeeded","data":{"payment_id":"test"}}'
   ```

---

### Issue 4: Duplicate Credits

**Symptom**: Same payment creates multiple credit records

**Check**: Unique constraint exists
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'credits' 
AND indexname = 'idx_credits_unique_payment';
```

**Fix**: If missing, run:
```sql
CREATE UNIQUE INDEX idx_credits_unique_payment 
ON credits(user_id, transaction_id) 
WHERE transaction_id IS NOT NULL;
```

---

### Issue 5: Credits Allocated But Not Showing in UI

**Symptom**: Database shows credits, but dashboard shows 0

**Check**:
1. API route working?
   ```bash
   curl http://localhost:3004/api/credits/balance \
     -H "Cookie: your-session-cookie"
   ```

2. Frontend calling correct API?
   - Open DevTools > Network
   - Look for `/api/credits/balance` request
   - Check response

**Fix**: Ensure `CreditsSection.tsx` is using `balance.total`:
```typescript
const { data: balance } = await fetch('/api/credits/balance')
// Use balance.total, not balance.remaining
```

---

### Issue 6: Invalid UUID Error

**Symptom**: Error like `invalid input syntax for type uuid: "sub_..."`

**Cause**: Subscription ID being passed where payment ID expected

**Fix**: Already fixed in webhook handler (lines 151, 183, 208)
```typescript
// Use latest_payment_id, not subscription_id
const paymentId = subscription.latest_payment_id || 
                  subscription.payment_id || 
                  `sub-${subscriptionId}`
```

---

## 📊 Manual Credit Allocation (Emergency Fix)

If you need to manually allocate credits for an orphaned payment:

```sql
-- Get the payment details
SELECT * FROM payments WHERE dodo_payment_id = 'pay_abc123';

-- Manually call the atomic function
SELECT add_credits_atomic(
  p_user_id := 'user-uuid-here'::uuid,
  p_amount := 1000,
  p_credit_type := 'subscription',
  p_transaction_id := 'pay_abc123',
  p_subscription_id := NULL,
  p_expires_at := (NOW() + INTERVAL '30 days')::timestamptz,
  p_description := 'Manual credit allocation - Professional plan',
  p_metadata := '{"manual": true, "reason": "orphaned payment"}'::jsonb
);

-- Verify
SELECT subscription_credits, permanent_credits 
FROM users 
WHERE id = 'user-uuid-here';
```

---

## 🎯 Prevention Checklist

To prevent this issue in the future:

- [ ] Always include `userId` in payment metadata
- [ ] Ensure webhook URL is correct in Dodo dashboard
- [ ] Keep tunnel running during testing
- [ ] Monitor webhook logs in terminal
- [ ] Run debug script after each test payment
- [ ] Check for orphaned payments regularly

---

## 📞 Still Not Working?

If credits still aren't being allocated:

1. **Check the exact error message** in the webhook logs
2. **Share the output** of the debug script
3. **Verify** the database migration was applied
4. **Test** with the local webhook test script
5. **Check** that the `add_credits_atomic` function exists and has correct permissions

---

## 🔗 Related Files

- Webhook Handler: `src/app/api/payments/webhook/route.ts`
- Credits Service: `src/lib/credits-service.ts`
- Database Migration: `data/db/migrations/20260216_fix_billing_system.sql`
- Debug Script: `scripts/debug-credits.ts`
- Test Script: `scripts/test-webhook.ts`

---

**Last Updated**: 2024-02-16
