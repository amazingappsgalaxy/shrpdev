# Credit System Fix: Double Allocation Prevention

## 1. Issue Description
Users were receiving double the amount of credits when purchasing a subscription. For example, a "Creator" plan that should grant 44,400 credits was granting 88,800 credits immediately upon purchase.

## 2. Root Cause Analysis
The issue was caused by a race condition in the webhook handler processing two events sent almost simultaneously by Dodo Payments:

1.  `subscription.active`: Sent when the subscription starts.
2.  `subscription.renewed`: Sent immediately after for the first period.

Both events trigger credit allocation. The `CreditsService` has an idempotency check to prevent duplicate allocations, but it relies on a unique **Transaction ID**.

*   **Before Fix:**
    *   `subscription.active` used ID: `sub-{subscription_id}`
    *   `subscription.renewed` used ID: `renewal-{subscription_id}-{timestamp}`
    *   **Result:** The database saw these as two *different* transactions, so it allowed both, resulting in double credits.

## 3. The Resolution

We implemented a **Deterministic Transaction ID** system based on the billing period.

### The Fix Logic
We modified `src/app/api/payments/webhook/route.ts` to generate IDs based on the **Period End Date**.

```typescript
// Format: sub_period_{subscriptionId}_{periodEnd}
const dateStr = new Date(periodEnd).toISOString().split('T')[0]
paymentId = `sub_period_${subscriptionId}_${dateStr}`
```

### Why this works
Since both `active` and `renewed` events refer to the exact same billing period (e.g., ending on `2026-03-XX`), they now generate the **identical Transaction ID**.
*   The first event to arrive allocates the credits.
*   The second event tries to use the same ID, causing the database to reject it as a duplicate (idempotency).

## 4. Verification
We verified this fix using a local reproduction script (`scripts/test-webhook-correct.ts`) that fired both events simultaneously.

**Logs Confirmation:**
```
✅ Processing subscription.active: sub_verify_...
🔍 [Active] Processing Transaction ID: sub_period_sub_verify_..._2026-03-19
✅ Allocated 44400 credits...

... (Milliseconds later) ...

🔄 Processing subscription.renewed: sub_verify_...
🔍 [Renewed] Processing Transaction ID: sub_period_sub_verify_..._2026-03-19
⚠️ Duplicate credit allocation prevented...
```

## 5. Deployment Notes

### Cloudflare Tunnel
During testing, we encountered an unrelated `530 Origin DNS Error` because the temporary Cloudflare tunnel had expired/disconnected.
*   **Action:** Restarted the tunnel.
*   **New URL:** `https://lined-cool-telecom-whilst.trycloudflare.com`
*   **Required:** Update the Webhook URL in Dodo Payments Dashboard.

### Database Migration
The fix relies on the `credits` table having a unique constraint on `(user_id, transaction_id)`. This was already present in the codebase, but ensure all migrations are applied if deploying to a fresh environment.

## 6. Implementation Code

Below is the code that implements the deterministic transaction IDs in `src/app/api/payments/webhook/route.ts`.

### `handleSubscriptionActive`
```typescript
async function handleSubscriptionActive(subscription: any) {
  console.log('✅ Processing subscription.active:', subscription.subscription_id || subscription.id)

  try {
    const userId = subscription.metadata?.userId || subscription.customer?.metadata?.userId
    const plan = subscription.metadata?.plan || subscription.plan || 'creator'
    const billingPeriod = subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly'
    const subscriptionId = subscription.subscription_id || subscription.id
    // Generate a deterministic transaction ID based on the period end date
    // This allows identifying duplicate events (e.g. Active + Renewed firing together for the same period)
    const periodEnd = subscription.next_billing_date || subscription.current_period_end
    let paymentId = subscription.latest_payment_id || subscription.payment_id

    if (periodEnd) {
      // Create a unique ID for this billing period
      // Format: sub_period_{subscriptionId}_{periodEnd}
      const dateStr = new Date(periodEnd).toISOString().split('T')[0]
      paymentId = `sub_period_${subscriptionId}_${dateStr}`
    } else {
      paymentId = paymentId || `sub-${subscriptionId}`
    }

    console.log(`🔍 [Active] Processing Transaction ID: ${paymentId}`)

    if (!userId) {
      console.error('❌ No userId found in subscription metadata')
      return
    }

    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Update subscription in database
    if (admin) {
      await admin.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        billing_period: billingPeriod,
        dodo_subscription_id: subscriptionId,
        dodo_customer_id: subscription.customer_id,
        next_billing_date: subscription.next_billing_date || subscription.current_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'dodo_subscription_id'
      })
    }

    // Allocate credits (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod as 'monthly' | 'yearly',
      subscriptionId,
      paymentId
    )

    if (result.duplicate) {
      console.log('⚠️ Duplicate subscription activation detected, credits already allocated')
    } else {
      console.log('✅ Subscription credits allocated successfully')
    }
  } catch (error) {
    console.error('❌ Error handling subscription.active:', error)
  }
}
```

### `handleSubscriptionRenewed`
```typescript
async function handleSubscriptionRenewed(subscription: any) {
  console.log('🔄 Processing subscription.renewed:', subscription.subscription_id || subscription.id)

  try {
    const userId = subscription.metadata?.userId || subscription.customer?.metadata?.userId
    const plan = subscription.metadata?.plan || subscription.plan || 'creator'
    const billingPeriod = subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly'
    const subscriptionId = subscription.subscription_id || subscription.id
    // Generate a deterministic transaction ID based on the period end date
    // This allows identifying duplicate events (e.g. Active + Renewed firing together for the same period)
    const periodEnd = subscription.next_billing_date || subscription.current_period_end
    let paymentId = subscription.latest_payment_id || subscription.payment_id

    if (periodEnd) {
      // Create a unique ID for this billing period
      // Format: sub_period_{subscriptionId}_{periodEnd}
      // This ensures both "Active" and "Renewed" events for the same period generate the same ID
      const dateStr = new Date(periodEnd).toISOString().split('T')[0]
      paymentId = `sub_period_${subscriptionId}_${dateStr}`
    } else {
      // Fallback if no date available
      paymentId = paymentId || `renewal-${subscriptionId}-${Date.now()}`
    }

    console.log(`🔍 [Renewed] Processing Transaction ID: ${paymentId}`)

    // Also use this ID for the user's reference in logs
    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Update subscription in database
    if (admin) {
      await admin.from('subscriptions').update({
        status: 'active',
        next_billing_date: subscription.next_billing_date || subscription.current_period_end,
        updated_at: new Date().toISOString()
      }).eq('dodo_subscription_id', subscriptionId)
    }

    // Allocate new credits for renewal (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod as 'monthly' | 'yearly',
      subscriptionId,
      paymentId
    )

    if (result.duplicate) {
      console.log('⚠️ Duplicate renewal detected, credits already allocated')
    } else {
      console.log('✅ Renewal credits allocated successfully')
    }
  } catch (error) {
    console.error('❌ Error handling subscription.renewed:', error)
  }
}
```
