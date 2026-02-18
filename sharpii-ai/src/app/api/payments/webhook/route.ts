import { NextRequest, NextResponse } from 'next/server'
import { CreditsService } from '@/lib/credits-service'
import { supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'
import crypto from 'crypto'

const admin = supabaseAdmin as any

function normalizeBillingPeriod(value: unknown): 'monthly' | 'yearly' | 'daily' {
  const v = String(value || 'monthly').toLowerCase()
  if (v === 'monthly' || v === 'yearly' || v === 'daily') return v
  if (v.startsWith('month')) return 'monthly'
  if (v.startsWith('year')) return 'yearly'
  if (v.startsWith('day')) return 'daily'
  return 'monthly'
}

// Verify Dodo webhook signature
function verifyDodoSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('⚠️ Webhook secret not set (DODO_WEBHOOK_SECRET / DODO_PAYMENTS_WEBHOOK_SECRET)')
    return false
  }

  try {
    const hmac = crypto.createHmac('sha256', webhookSecret)
    const digest = hmac.update(body).digest('hex')
    return digest === signature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log('🔔 Webhook received at:', timestamp)

  // Log to DB for debugging
  try {
    const bodyText = await request.clone().text()
    const headerObj = Object.fromEntries(request.headers.entries())

    if (admin) {
      await admin.from('webhook_logs').insert({
        method: request.method,
        url: request.url,
        headers: headerObj,
        body: bodyText
      })
    }
  } catch (logError) {
    console.error('Failed to log webhook:', logError)
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('dodo-signature')

    // Verify signature in production
    if (signature && process.env.NODE_ENV === 'production') {
      const isValid = verifyDodoSignature(body, signature)
      if (!isValid) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    console.log('📋 Event type:', event.type)

    // Route to appropriate handler
    switch (event.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data)
        break

      case 'subscription.active':
        await handleSubscriptionActive(event.data)
        break

      case 'subscription.renewed':
        await handleSubscriptionRenewed(event.data)
        break
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Handle payment.succeeded event
 * This is the ONLY place where we allocate credits for one-time payments
 */
async function handlePaymentSucceeded(payment: any) {
  console.log('💳 Processing payment.succeeded:', payment.payment_id || payment.id)

  try {
    // Extract user and plan info
    let userId = payment.metadata?.userId || payment.customer?.metadata?.userId
    const plan = payment.metadata?.plan || 'creator'
    const billingPeriod = normalizeBillingPeriod(payment.metadata?.billingPeriod || 'monthly')
    const paymentId = payment.payment_id || payment.id
    const subscriptionId = payment.subscription_id

    if (!userId) {
      console.log('⚠️ No userId found in payment metadata, attempting lookup by customer_id')
      if (admin && payment.customer_id) {
        // @ts-ignore
        const { data: subData } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('dodo_customer_id', payment.customer?.customer_id || payment.customer_id)
          .single()

        // @ts-ignore
        if (subData?.user_id) {
          // @ts-ignore
          userId = subData.user_id
          console.log('✅ Found userId from customer_id lookup:', userId)
        } else {
          console.error('❌ Could not find user for payment:', paymentId)
          return
        }
      } else {
        console.error('❌ No userId found and admin/customer_id missing')
        return
      }
    }

    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Record payment in database
    if (admin) {
      const { data: existingPayment } = await admin
        .from('payments')
        .select('id')
        .eq('dodo_payment_id', paymentId)
        .limit(1)
        .maybeSingle()

      if (existingPayment?.id) {
        console.log('ℹ️ Payment already recorded:', paymentId)
      } else {
      // @ts-ignore - Supabase type definitions are camelCase but DB is snake_case
      const { error: insertError } = await admin.from('payments').insert({
        user_id: userId,
        dodo_payment_id: paymentId,
        dodo_customer_id: payment.customer?.customer_id || payment.customer_id,
        amount: payment.amount || payment.total_amount || 0,
        currency: payment.currency || 'INR',
        status: 'succeeded',
        payment_method: payment.payment_method || 'card',
        plan,
        billing_period: billingPeriod,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: payment
      })

      if (insertError) {
        console.error('❌ Failed to insert payment:', insertError)
      }
      }
    }

    if (subscriptionId) {
      try {
        const creditsOverrideRaw = payment.metadata?.credits
        const creditsOverride =
          creditsOverrideRaw !== undefined && creditsOverrideRaw !== null && !Number.isNaN(Number(creditsOverrideRaw))
            ? Number(creditsOverrideRaw)
            : undefined

        const providerSubscription: any = await (dodo as any).subscriptions.retrieve(subscriptionId)
        const periodEnd = providerSubscription?.next_billing_date || providerSubscription?.current_period_end || null
        const dateStr = periodEnd ? new Date(periodEnd).toISOString().split('T')[0] : null
        const transactionId = dateStr ? `sub_period_${subscriptionId}_${dateStr}` : `sub-${subscriptionId}`
        const resolvedUserId =
          providerSubscription?.metadata?.userId ||
          providerSubscription?.metadata?.user_id ||
          providerSubscription?.customer?.metadata?.userId ||
          providerSubscription?.customer?.metadata?.user_id ||
          userId
        const resolvedPlan = providerSubscription?.metadata?.plan || providerSubscription?.plan || plan
        const resolvedBillingPeriod = normalizeBillingPeriod(
          providerSubscription?.metadata?.billingPeriod ||
            providerSubscription?.billing_period ||
            billingPeriod ||
            'monthly'
        )

        if (!resolvedUserId) return

        await CreditsService.allocateSubscriptionCredits(
          resolvedUserId,
          resolvedPlan,
          resolvedBillingPeriod,
          subscriptionId,
          transactionId,
          {
            expiresAt: periodEnd ? new Date(periodEnd) : undefined,
            credits: creditsOverride,
            metadata: { source: 'webhook.payment_succeeded' }
          }
        )
      } catch (e) {
      }
      return
    }

    // Allocate credits (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod as 'monthly' | 'yearly',
      null, // No subscription ID for one-time payment
      paymentId
    )

    if (result.duplicate) {
      console.log('⚠️ Duplicate payment detected, credits already allocated')
    } else {
      console.log('✅ Credits allocated successfully')
    }
  } catch (error) {
    console.error('❌ Error handling payment.succeeded:', error)
  }
}

/**
 * Handle subscription.active event
 * This is the ONLY place where we allocate credits for subscriptions
 */
async function handleSubscriptionActive(subscription: any) {
  console.log('✅ Processing subscription.active:', subscription.subscription_id || subscription.id)

  try {
    let userId =
      subscription.metadata?.userId ||
      subscription.metadata?.user_id ||
      subscription.customer?.metadata?.userId ||
      subscription.customer?.metadata?.user_id ||
      null
    const plan = subscription.metadata?.plan || subscription.plan || 'creator'
    const billingPeriod = normalizeBillingPeriod(subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly')
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

    if (!userId && admin) {
      const customerId = subscription.customer?.customer_id || subscription.customer_id || null
      if (customerId) {
        const { data: subRow } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('dodo_customer_id', customerId)
          .limit(1)
          .maybeSingle()
        if ((subRow as any)?.user_id) userId = (subRow as any).user_id
      }
    }

    if (!userId) return

    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Update subscription in database
    if (admin) {
      console.log('📝 Attempting to upsert subscription:', subscriptionId)
      // @ts-ignore - Supabase type definitions are camelCase but DB is snake_case
      const { error: upsertError } = await admin.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        billing_period: billingPeriod,
        dodo_subscription_id: subscriptionId,
        dodo_customer_id: subscription.customer?.customer_id || subscription.customer_id,
        next_billing_date: subscription.next_billing_date || subscription.current_period_end,
        billing_name: subscription.customer?.name || subscription.metadata?.user_name,
        billing_email: subscription.customer?.email || subscription.metadata?.user_email,
        billing_address: subscription.billing || subscription.customer?.billing,
        currency: subscription.currency || 'USD',
        amount: subscription.recurring_pre_tax_amount || subscription.amount || 0,
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

      if (upsertError) {
        console.error('❌ database upsert error:', upsertError)
        console.error('❌ upsert error details:', JSON.stringify(upsertError))
      } else {
        console.log('✅ Subscription upserted successfully')
      }
    } else {
      console.error('❌ Admin client not available for subscription upsert')
    }

    // Allocate credits (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod,
      subscriptionId,
      paymentId,
      { expiresAt: periodEnd ? new Date(periodEnd) : undefined }
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

/**
 * Handle subscription.renewed event
 * Allocate new credits for the renewal period
 */
async function handleSubscriptionRenewed(subscription: any) {
  console.log('🔄 Processing subscription.renewed:', subscription.subscription_id || subscription.id)

  try {
    let userId =
      subscription.metadata?.userId ||
      subscription.metadata?.user_id ||
      subscription.customer?.metadata?.userId ||
      subscription.customer?.metadata?.user_id ||
      null
    const plan = subscription.metadata?.plan || subscription.plan || 'creator'
    const billingPeriod = normalizeBillingPeriod(subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly')
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

    if (!userId && admin) {
      const customerId = subscription.customer?.customer_id || subscription.customer_id || null
      if (customerId) {
        const { data: subRow } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('dodo_customer_id', customerId)
          .limit(1)
          .maybeSingle()
        if ((subRow as any)?.user_id) userId = (subRow as any).user_id
      }
    }

    if (!userId) return

    console.log(`👤 User: ${userId}, Plan: ${plan}, Period: ${billingPeriod}`)

    // Update subscription in database
    if (admin) {
      // @ts-ignore - Supabase type definitions are camelCase but DB is snake_case
      await admin.from('subscriptions').update({
        status: 'active',
        next_billing_date: subscription.next_billing_date || subscription.current_period_end,
        updated_at: new Date().toISOString()
      }).eq('dodo_subscription_id', subscriptionId)
    }

    // Allocate credits (with idempotency built-in)
    const result = await CreditsService.allocateSubscriptionCredits(
      userId,
      plan,
      billingPeriod,
      subscriptionId,
      paymentId,
      { expiresAt: periodEnd ? new Date(periodEnd) : undefined }
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

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const subscriptionId = subscription.subscription_id || subscription.id
    if (!admin || !subscriptionId) return
    const nextBillingDate = subscription.next_billing_date || subscription.current_period_end || null
    const cancelAtNextBilling = !!subscription.cancel_at_next_billing_date
    const subscriptionStatus = cancelAtNextBilling ? 'pending_cancellation' : subscription.status || 'active'
    const customerId = subscription.customer?.customer_id || subscription.customer_id || null

    let userId =
      subscription.metadata?.userId ||
      subscription.metadata?.user_id ||
      subscription.customer?.metadata?.userId ||
      subscription.customer?.metadata?.user_id ||
      null

    if (!userId && customerId) {
      const { data: subRow } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('dodo_customer_id', customerId)
        .limit(1)
        .maybeSingle()
      if ((subRow as any)?.user_id) userId = (subRow as any).user_id
    }

    if (!userId) return

    await admin.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: subscription.metadata?.plan || subscription.plan || 'creator',
        status: subscriptionStatus,
        billing_period: normalizeBillingPeriod(subscription.metadata?.billingPeriod || subscription.billing_period || 'monthly'),
        dodo_subscription_id: subscriptionId,
        dodo_customer_id: customerId,
        next_billing_date: nextBillingDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  } catch {
  }
}
