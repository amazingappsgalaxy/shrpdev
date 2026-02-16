# Testing Guide - Payment & Credits System

## 🌐 Current Setup

**Tunnel URL**: https://enrolled-artwork-bean-payments.trycloudflare.com
**Webhook Endpoint**: https://enrolled-artwork-bean-payments.trycloudflare.com/api/payments/webhook

---

## ✅ System Status

### Services Running
- ✅ Next.js Dev Server: http://localhost:3004
- ✅ Cloudflare Tunnel: Active
- ✅ All API Routes: Working
- ✅ Dashboard Components: Created

### Database
- ✅ Schema updated with credit columns
- ✅ Atomic functions created
- ✅ Unique constraints added
- ✅ Idempotency protection enabled

---

## 🧪 Testing Steps

### 1. Update Webhook URL in Dodo Payments
Go to your Dodo Payments dashboard and update the webhook URL to:
```
https://enrolled-artwork-bean-payments.trycloudflare.com/api/payments/webhook
```

### 2. Test Payment Flow
1. Make a test payment through your app
2. Watch the terminal for webhook logs
3. Look for these messages:
   - `🔔 Webhook received`
   - `💳 Processing payment.succeeded`
   - `✅ Credits allocated successfully`

### 3. Verify No Duplicates
The system should prevent duplicate credits. You'll see:
- First payment: `✅ Credits allocated successfully`
- Duplicate webhook: `⚠️ Duplicate payment detected, credits already allocated`

### 4. Check Database
```sql
-- Check credits were allocated only once
SELECT * FROM credits 
WHERE transaction_id = 'your-payment-id';
-- Should return exactly 1 row

-- Check user balance
SELECT 
  subscription_credits, 
  permanent_credits,
  subscription_credits_expire_at
FROM users 
WHERE id = 'your-user-id';
```

### 5. Test Dashboard
Visit: http://localhost:3004/app/dashboard

**Credits Tab** should show:
- Total credits (large number)
- Subscription credits with expiry date
- Permanent credits (no expiry)
- Current plan status
- Top-up section (locked if no subscription)

**Usage Tab** should show:
- Transaction history table
- Task IDs for deductions
- Credit/debit amounts
- Running balance

**Billing Tab** should show:
- Current subscription details
- Payment history
- Upgrade/cancel buttons

---

## 🔍 What to Look For

### ✅ Good Signs
1. **Single Credit Grant**: Each payment creates exactly 1 credit record
2. **Correct Balance**: User balance matches expected amount
3. **Expiry Date**: Subscription credits show expiry 30 days from now
4. **Transaction Log**: All transactions recorded with task IDs
5. **No Errors**: No console errors in browser or terminal

### ❌ Bad Signs
1. **Duplicate Credits**: Same payment_id creates multiple credit records
2. **Missing Credits**: Payment succeeded but no credits added
3. **Wrong Balance**: User balance doesn't match database
4. **API Errors**: 500 errors in API routes
5. **Missing Data**: Dashboard shows 0 credits when there should be some

---

## 📊 Expected Behavior

### Payment Flow
```
User pays $29.99 for Professional plan
  ↓
Dodo sends webhook: payment.succeeded
  ↓
Webhook handler processes event
  ↓
Calls add_credits_atomic(userId, 1000, paymentId)
  ↓
Database function checks for duplicates
  ↓
If new: Insert credits, update user balance
If duplicate: Return "already exists"
  ↓
Credits allocated exactly once ✅
```

### Credit Deduction Flow (Future)
```
User clicks "Enhance Image" (200 credits)
  ↓
Frontend calls /api/credits/deduct
  ↓
Calls deduct_credits_atomic(userId, 200, taskId)
  ↓
Database function:
  - Locks user row
  - Checks balance >= 200
  - Deducts from subscription_credits first
  - Then from permanent_credits
  - Records transaction with task_id
  ↓
Returns success with breakdown ✅
```

---

## 🐛 Troubleshooting

### Issue: Credits not showing in dashboard
**Check:**
1. Is user logged in? Check session cookie
2. Are API routes returning data? Check Network tab
3. Is database populated? Run SQL queries

### Issue: Duplicate credits still happening
**Check:**
1. Is unique constraint on payments table? 
   ```sql
   SELECT constraint_name FROM information_schema.table_constraints 
   WHERE table_name = 'payments' AND constraint_name = 'payments_dodo_payment_id_key';
   ```
2. Is unique index on credits table?
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'credits' AND indexname = 'idx_credits_unique_payment';
   ```
3. Check webhook logs for error messages

### Issue: Webhook not receiving events
**Check:**
1. Is tunnel URL correct in Dodo dashboard?
2. Is tunnel still running? Check terminal
3. Is webhook signature valid? Check logs

---

## 📝 Test Checklist

- [ ] Webhook URL updated in Dodo dashboard
- [ ] Make test payment
- [ ] Verify webhook received (check terminal)
- [ ] Verify credits allocated (check database)
- [ ] Verify no duplicates (check database)
- [ ] Check dashboard shows correct balance
- [ ] Check usage tab shows transaction
- [ ] Check billing tab shows payment
- [ ] Verify expiry date is 30 days from now
- [ ] Test with multiple payments
- [ ] Verify each payment creates exactly 1 credit record

---

## 🎯 Success Criteria

✅ **Payment System Working** if:
1. Each payment creates exactly 1 credit record
2. User balance increases by correct amount
3. Subscription credits have expiry date
4. Transaction history shows all activities
5. Dashboard displays all data correctly
6. No duplicate credits even with webhook retries

---

## 📞 Next Steps After Testing

Once payment testing is complete:
1. ✅ Confirm no duplicate credits
2. ✅ Verify dashboard shows correct data
3. 🔄 Implement editor integration (deduct credits on enhance)
4. 🔄 Add upgrade modal for insufficient credits
5. 🔄 Implement top-up credit purchase flow
6. 🔄 Add plan upgrade/downgrade functionality

---

**Current Status**: Ready for testing! 🚀
