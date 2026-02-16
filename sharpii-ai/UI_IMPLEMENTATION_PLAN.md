# UI Implementation Plan - Billing & Credits Dashboard

## Overview
Complete redesign of dashboard with minimal, crystal-clear UI showing subscription status, credits breakdown, usage history, and billing information.

---

## 1. Dashboard Layout (Segmented Control)

### Main Sections (Tabs)
```
┌─────────────────────────────────────────────────────────┐
│  [Overview] [Usage] [Billing]                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Overview Tab

### A. Credits Display (Top Section)
```
┌─────────────────────────────────────────────────────────┐
│  Total Credits: 1,250 ⓘ                                │
│                                                         │
│  Hover tooltip shows:                                   │
│  • Subscription Credits: 1,000 (expires Feb 28, 2026)  │
│  • Permanent Credits: 250 (no expiry)                  │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Large number display for total credits
- Hover tooltip with breakdown
- Color coding: subscription (yellow), permanent (green)
- Expiry date warning if < 7 days

### B. Current Plan Card
```
┌─────────────────────────────────────────────────────────┐
│  Current Plan: Professional                             │
│  Status: Active                                         │
│  Renews: March 15, 2026                                │
│                                                         │
│  [Upgrade Plan]                                        │
└─────────────────────────────────────────────────────────┘
```

**OR if no plan:**
```
┌─────────────────────────────────────────────────────────┐
│  No Active Plan                                         │
│                                                         │
│  Subscribe to unlock premium features and get           │
│  monthly credits.                                       │
│                                                         │
│  [View Plans]                                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- API: `/api/user/subscription`
- Show plan name, status badge, renewal date
- Upgrade button (opens pricing modal)
- If no plan: show call-to-action

### C. Top-Up Credits Section
```
┌─────────────────────────────────────────────────────────┐
│  Top-Up Permanent Credits                               │
│                                                         │
│  [500 Credits - $5] [1000 Credits - $9]                │
│  [2500 Credits - $20] [5000 Credits - $35]             │
└─────────────────────────────────────────────────────────┘
```

**OR if no active subscription:**
```
┌─────────────────────────────────────────────────────────┐
│  🔒 Top-Up Credits Locked                               │
│                                                         │
│  Subscribe to any plan to unlock the ability to         │
│  purchase permanent credits.                            │
│                                                         │
│  [View Plans]                                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Check: `/api/user/subscription` → `has_active_subscription`
- If false: show locked state
- If true: show credit packages
- On purchase: call Dodo Payments API

---

## 3. Usage Tab

### Transaction History Table
```
┌──────────────────────────────────────────────────────────────────────┐
│  Date         │ Task ID      │ Description        │ Credits │ Balance │
├──────────────────────────────────────────────────────────────────────┤
│  Feb 16, 2:30 │ task-abc123  │ Image Enhancement  │ -200    │ 1,250   │
│  Feb 16, 1:15 │ payment-xyz  │ Pro Plan Credits   │ +1,000  │ 1,450   │
│  Feb 15, 5:45 │ task-def456  │ Skin Enhancement   │ -150    │ 450     │
│  Feb 15, 3:20 │ topup-789    │ Credit Top-Up      │ +500    │ 600     │
└──────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- API: `/api/credits/history?limit=50`
- Show all transactions (debits and credits)
- Display task IDs for debits
- Color code: green for credits, red for debits
- Show running balance
- Pagination for > 50 transactions

---

## 4. Billing Tab

### A. Payment History
```
┌──────────────────────────────────────────────────────────────────────┐
│  Date         │ Plan          │ Amount  │ Status    │ Invoice        │
├──────────────────────────────────────────────────────────────────────┤
│  Feb 16, 2026 │ Professional  │ $29.99  │ Paid      │ [Download PDF] │
│  Jan 16, 2026 │ Professional  │ $29.99  │ Paid      │ [Download PDF] │
│  Dec 16, 2025 │ Basic         │ $9.99   │ Paid      │ [Download PDF] │
└──────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- API: `/api/user/payments`
- Show all payments from `payments` table
- Status badges (Paid, Failed, Refunded)
- Download invoice button (generate PDF or link to Dodo invoice)

### B. Current Subscription Details
```
┌─────────────────────────────────────────────────────────┐
│  Active Subscription                                    │
│                                                         │
│  Plan: Professional                                     │
│  Billing: $29.99/month                                 │
│  Next Billing: March 16, 2026                          │
│                                                         │
│  [Upgrade Plan] [Cancel Subscription]                  │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Show subscription details
- Upgrade button (opens pricing modal with current plan highlighted)
- Cancel button (with confirmation modal)

---

## 5. Editor Integration

### Before Enhancement
```
┌─────────────────────────────────────────────────────────┐
│  Settings: [...]                                        │
│                                                         │
│  Estimated Cost: 200 credits                           │
│  Your Balance: 1,250 credits                           │
│                                                         │
│  [Enhance Image]                                       │
└─────────────────────────────────────────────────────────┘
```

### If Insufficient Credits
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Insufficient Credits                                │
│                                                         │
│  This enhancement requires 200 credits.                 │
│  You have 50 credits remaining.                        │
│                                                         │
│  [Upgrade Plan] [Buy Credits]                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Calculate estimated cost based on settings
- Fetch user balance: `/api/credits/balance`
- On "Enhance" click:
  1. Check if balance >= cost
  2. If no: show upgrade modal
  3. If yes: deduct credits via `/api/credits/deduct`
  4. Start enhancement task
  5. Record task ID in transaction

---

## 6. Credit Deduction Flow

### Step-by-Step
1. User clicks "Enhance Image"
2. Frontend calls `/api/credits/deduct`:
   ```json
   {
     "amount": 200,
     "taskId": "task-abc123",
     "description": "Image Enhancement - Skin Editor"
   }
   ```
3. Backend uses `deduct_credits_atomic()`:
   - Checks balance
   - Deducts from subscription credits first
   - Then from permanent credits
   - Records transaction with task ID
4. Returns success/failure
5. If success: proceed with enhancement
6. If failure: show upgrade modal

---

## 7. Database Functions Used

### For Credits Display
```sql
SELECT * FROM get_user_credits('user-id');
-- Returns: { total, subscription_credits, permanent_credits, subscription_expire_at }
```

### For Credit Deduction
```sql
SELECT * FROM deduct_credits_atomic(
  'user-id', 
  200, 
  'task-abc123', 
  'Image Enhancement'
);
-- Returns: { success, deducted, from_subscription, from_permanent, balance_after }
```

### For Credit Allocation (Webhook)
```sql
SELECT * FROM add_credits_atomic(
  'user-id',
  1000,
  'subscription',
  'payment-xyz',
  'sub-123',
  '2026-03-16',
  'Professional Plan Credits',
  '{"plan": "professional"}'::jsonb
);
-- Returns: { success, duplicate, credit_id, message }
```

---

## 8. Key Features

### Idempotency
- ✅ Duplicate payments prevented by unique constraint on `payments.dodo_payment_id`
- ✅ Duplicate credit grants prevented by unique index on `credits(user_id, transaction_id)`
- ✅ Database function checks for existing credits before inserting

### Credit Hierarchy
- ✅ Always use subscription credits first
- ✅ Then use permanent credits
- ✅ Tracked in transaction metadata

### Expiry Logic
- ✅ Subscription credits expire 30 days after grant
- ✅ Permanent credits never expire
- ✅ Cron job to expire old credits: `SELECT expire_subscription_credits();`

### Security
- ✅ All API routes check session authentication
- ✅ Database functions use SECURITY DEFINER
- ✅ RLS policies on tables

---

## 9. Component Structure

```
src/
├── components/
│   └── app/
│       └── dashboard/
│           ├── DashboardTabs.tsx          (Main segmented control)
│           ├── OverviewTab.tsx            (Credits + Plan + Top-up)
│           ├── UsageTab.tsx               (Transaction history)
│           ├── BillingTab.tsx             (Payments + Subscription)
│           ├── CreditsDisplay.tsx         (Total with tooltip)
│           ├── CurrentPlanCard.tsx        (Plan status)
│           ├── TopUpSection.tsx           (Credit packages)
│           └── TransactionTable.tsx       (Usage history)
├── app/
│   └── api/
│       ├── credits/
│       │   ├── balance/route.ts           ✅ Created
│       │   ├── history/route.ts           ✅ Created
│       │   └── deduct/route.ts            ✅ Created
│       ├── user/
│       │   ├── subscription/route.ts      ✅ Created
│       │   └── payments/route.ts          (To create)
│       └── payments/
│           └── webhook/route.ts           ✅ Fixed
└── lib/
    ├── credits-service.ts                 ✅ Rewritten
    ├── unified-credits.ts                 ✅ Simplified
    └── subscription-service.ts            ✅ Created
```

---

## 10. Testing Checklist

### Payment Flow
- [ ] Make payment → credits allocated once
- [ ] Make duplicate payment → credits NOT duplicated
- [ ] Subscription renewal → new credits allocated
- [ ] Check `payments` table for unique constraint

### Credit Display
- [ ] Total shows correctly
- [ ] Hover tooltip shows breakdown
- [ ] Expiry date displays
- [ ] Updates in real-time after deduction

### Credit Deduction
- [ ] Editor shows estimated cost
- [ ] Deduction uses subscription credits first
- [ ] Then uses permanent credits
- [ ] Transaction recorded with task ID
- [ ] Insufficient credits shows upgrade modal

### Subscription Status
- [ ] Active plan shows correctly
- [ ] No plan shows "No Active Plan"
- [ ] Top-up locked without subscription
- [ ] Top-up unlocked with subscription

### UI/UX
- [ ] Segmented control works
- [ ] All tabs load correctly
- [ ] No console errors
- [ ] Mobile responsive

---

## Next Steps

1. ✅ Database schema fixed
2. ✅ Atomic functions created
3. ✅ CreditsService rewritten
4. ✅ Webhook handler fixed
5. ✅ API routes created
6. ⏳ Create UI components
7. ⏳ Integrate with editor
8. ⏳ Test complete flow
