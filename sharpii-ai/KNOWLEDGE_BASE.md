# Sharpii.ai Knowledge Base
> Single source of truth for the entire Sharpii.ai platform
> Last updated: 2026-02-19

---

## 1. Product Overview

Sharpii.ai is an AI-powered image enhancement SaaS. Users purchase subscription plans, receive monthly credits, and spend those credits to enhance images using AI models (RunningHub / ComfyUI).

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.4.6 (App Router) |
| UI | React 19, TailwindCSS, Framer Motion |
| Database | Supabase (Postgres 17, `igsyhvrctnqntqujqfif`) |
| Auth | Custom session-based (`src/lib/auth-simple.ts`) |
| Payments | DodoPayments (NOT Stripe) |
| AI Backend | RunningHub (ComfyUI-as-a-service) |
| Dev Port | 3003 |
| Tunnel | trycloudflare.com (changes on each start) |

---

## 3. Pricing Plans

| Plan | Monthly | Annual | Monthly Credits |
|------|---------|--------|-----------------|
| Basic | $9 | $96/yr | 16,200 |
| Creator | $25 | $252/yr | 44,400 |
| Professional | $39 | $408/yr | 73,800 |
| Enterprise | $99 | $1,008/yr | 187,800 |
| Day Pass | $10 | — | 9,900 (24h) |

**Key rules:**
- Credits refresh monthly (subscription credits expire at end of billing period)
- Annual plan credits are still allocated monthly (30-day rolling expiry per batch)
- Top-up (permanent) credits never expire and require an active plan to purchase
- Only one subscription at a time per user

### Dodo Product IDs (test mode)
| Plan | Period | Product ID |
|------|--------|-----------|
| Creator | Monthly | `pdt_0NYlpIymBOLG7VGKUM3pF` |
| Creator | Yearly | `pdt_WNr5iJDaFOiDCXWKZWjX2` |
| Day Pass | Daily | `pdt_0NYhE3lLB1AVBQ1IF1NzS` |
| Others | — | Configure in `.env.local` when products created in Dodo |

---

## 4. Credits System

### Two types of credits
| Type | Expiry | Source |
|------|--------|--------|
| `subscription` | End of billing period | Plan purchase / renewal |
| `permanent` | Never (2099-12-31) | Top-up purchases |

### Deduction order
Subscription credits are consumed first, then permanent credits.

### Atomic DB functions (SECURITY DEFINER)
| Function | Purpose |
|----------|---------|
| `add_credits_atomic` | Add credits with idempotency (unique per `transaction_id`) |
| `deduct_credits_atomic` | Deduct credits (subscription first, then permanent) |
| `get_user_credits` | Return `{ total, subscription_credits, permanent_credits, subscription_expire_at }` |
| `expire_subscription_credits` | Batch-expire stale subscription credits (cron) |
| `expire_user_subscription_credits` | Expire one user's subscription credits (used by Day Pass) |

### Idempotency keys
- Subscription credits: `sub_period_{dodoSubscriptionId}_{YYYY-MM-DD}` (period end date)
- One-time payments: Dodo `payment_id`
- Duplicate `transaction_id` → `add_credits_atomic` returns `{ duplicate: true }`, no re-credit

---

## 5. Payment Flow

### 5.1 Checkout (user initiates purchase)
1. User clicks plan → `POST /api/payments/checkout` with `{ plan, billingPeriod }`
2. Route looks up product ID from env vars, creates Dodo checkout session
3. `return_url` is derived from `new URL(request.url).origin` (dynamic – never hardcoded)
4. Checkout session stored in `checkout_sessions` DB table (NOT in-memory/JSON)
5. Dodo checkout URL returned to client → browser redirected to Dodo

### 5.2 Return from Dodo
1. User completes payment on Dodo → redirected to `{origin}/payment-success?subscription_id=xxx`
2. `/payment-success` page calls `POST /api/payments/complete` with subscription_id
3. `complete` route retrieves subscription from Dodo API, verifies ownership, allocates credits
4. If subscription not yet active (202), page retries up to 12 times × 5s = 60s
5. After max retries, shows "Payment Received – credits appear shortly" and redirects to dashboard

### 5.3 Webhook (Dodo → our server)
Webhook URL must be set in Dodo dashboard to current tunnel URL:
`https://{tunnel}.trycloudflare.com/api/payments/webhook`

| Webhook Event | Action |
|--------------|--------|
| `subscription.active` | Upsert subscription in DB, allocate credits |
| `subscription.renewed` | Update next_billing_date, allocate credits for new period |
| `subscription.updated` | Sync status (handles `cancel_at_next_billing_date → pending_cancellation`) |
| `payment.succeeded` | Record payment, allocate credits if subscription exists |

**Signature verification:** Standard Webhooks spec
- Headers: `webhook-id`, `webhook-timestamp`, `webhook-signature`
- Message: `{webhook-id}.{webhook-timestamp}.{raw-body}`
- Secret: `DODO_WEBHOOK_SECRET` (base64 value after stripping `whsec_` prefix)

---

## 6. Subscription Scenarios

### Scenario 1 – Cancel (turn off auto-renew)
- User clicks "Turn off auto-renew" → `POST /api/user/subscription/cancel`
- Calls `dodo.subscriptions.update(id, { cancel_at_next_billing_date: true })`
- DB status updated to `pending_cancellation`
- Plan stays active + credits usable until `next_billing_date`
- Top-up still available until `next_billing_date`
- After `next_billing_date`: subscription → `cancelled`, credits expired

### Scenario 2 – Upgrade monthly plan
- User pays `new_price - current_price` prorated by Dodo
- `subscription.plan_changed` webhook fires OR `subscription.updated` fires
- New credits = difference (e.g., 73,800 − 44,400 = 29,400) added
- Same expiry date maintained

### Scenario 3 – Upgrade monthly → annual same plan
- User pays `annual_price - current_month_price`
- Gets first month's credits (same as monthly); subsequent months added on renewal
- Annual subscription fires `subscription.renewed` each month (Dodo FAQ confirms this)

### Scenario 4 – Top-up permanent credits
- Only available when `has_active_subscription = true` (plan active, even if cancelled)
- `POST /api/credits/purchase` with credit package
- Credits allocated with `credit_type = 'permanent'`, expiry far-future (2099)
- Usable even after plan expires

---

## 7. Authentication

- Custom session-based auth in `src/lib/auth-simple.ts`
- Passwords hashed with bcrypt (12 rounds)
- Session tokens stored in `sessions` table, cookie: `session=<token>` (httpOnly)
- `useAuth()` hook: `src/lib/auth-client-simple.ts` → hits `/api/auth/session`
- Middleware protects `/app/*` only
- `unified-auth.ts` returns MOCK data (Better-auth disabled)

---

## 8. Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Core user records; `subscription_credits`, `permanent_credits`, `subscription_credits_expire_at` cached here |
| `sessions` | Auth sessions |
| `subscriptions` | One row per user (upserted on subscription events); `dodo_subscription_id`, `status`, `next_billing_date` |
| `credits` | Every credit allocation row (`credit_type`, `transaction_id`, `expires_at`) |
| `credit_transactions` | Audit log for all credits/debits |
| `payments` | Payment records from Dodo |
| `checkout_sessions` | Maps Dodo checkout session/subscription IDs → user (replaces payment-mapping.json) |
| `history_items` | Enhancement job records |
| `webhook_logs` | All raw Dodo webhook payloads (debug) |
| `invoices` | Invoice metadata |

---

## 9. Important Files

| File | Purpose |
|------|---------|
| `src/lib/auth-simple.ts` | Real auth logic |
| `src/lib/auth-client-simple.ts` | Client `useAuth()` hook |
| `src/lib/credits-service.ts` | `CreditsService` – allocate/deduct/history |
| `src/lib/unified-credits.ts` | Thin wrapper around `CreditsService` |
| `src/lib/pricing-config.ts` | `PRICING_PLANS` array (single source of truth for plan pricing/credits) |
| `src/lib/dodo-payments-config.ts` | Product ID mapping from env vars |
| `src/lib/dodo-client.ts` | DodoPayments SDK client |
| `src/lib/payment-utils.ts` | DB-based checkout session correlation |
| `src/app/api/payments/checkout/route.ts` | Initiate Dodo checkout session |
| `src/app/api/payments/complete/route.ts` | Post-return confirmation + credit allocation |
| `src/app/api/payments/webhook/route.ts` | Dodo webhook handler |
| `src/app/api/user/subscription/route.ts` | Get active subscription |
| `src/app/api/user/subscription/cancel/route.ts` | Cancel auto-renewal |
| `src/app/api/credits/balance/route.ts` | Get credit balance |
| `src/app/app/dashboard/page.tsx` | Dashboard (Credits / Usage / Billing tabs) |
| `src/app/payment-success/page.tsx` | Post-payment confirmation page |

---

## 10. Environment Variables

```env
# Dodo Payments
DODO_PAYMENTS_API_KEY=...
DODO_WEBHOOK_SECRET=whsec_...          # Standard Webhooks secret

# Product IDs (set to Dodo product IDs for each plan)
DODO_CREATOR_MONTHLY_PRODUCT_ID=pdt_0NYlpIymBOLG7VGKUM3pF
DODO_CREATOR_YEARLY_PRODUCT_ID=pdt_WNr5iJDaFOiDCXWKZWjX2
# Others: blank until products created in Dodo dashboard

# App URL – update to current tunnel when testing
# (checkout route derives return URL dynamically from request.url)
NEXT_PUBLIC_APP_URL=https://{tunnel}.trycloudflare.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://igsyhvrctnqntqujqfif.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# RunningHub
RUNNINGHUB_API_KEY=...
```

---

## 11. Known Issues / Technical Debt

1. **Auth bypass** in `/api/enhance-image` (testing mode comment – not production-ready)
2. **`unified-auth.ts`** returns hardcoded mock user (Better-auth disabled)
3. **Admin credentials** hardcoded in client-side JS (`/admin` page)
4. **DB type mismatch** in `supabase.ts`: camelCase types vs snake_case columns (many `@ts-ignore`)
5. **Annual plan monthly credits**: Dodo fires `subscription.renewed` monthly for annual plans (confirmed in Dodo FAQ); current code handles this correctly via idempotency keys

---

## 12. Dev / Test Workflow

### Starting the tunnel
```bash
cd sharpii-ai && npm run dev
# In another terminal:
cloudflared tunnel --url http://localhost:3003
```

### After getting new tunnel URL
1. Update `NEXT_PUBLIC_APP_URL` in `.env.local`
2. Update webhook URL in Dodo dashboard → Settings → Webhooks
3. Restart dev server to reload env vars

### Test credit flow (Creator Monthly)
1. Register new user
2. Click "Get Started" on Creator plan → should redirect to Dodo checkout
3. Complete payment with test card
4. Should be redirected to `/payment-success` → `/app/dashboard`
5. Dashboard should show 44,400 subscription credits with expiry date

### Cancellation test
1. From dashboard Billing tab → "Turn off auto-renew"
2. Confirm → status becomes "Cancels at period end"
3. Credits still visible and usable
4. After billing date: subscription → cancelled, credits expired
