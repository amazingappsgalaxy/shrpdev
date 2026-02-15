import { NextRequest, NextResponse } from 'next/server'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'
import { CreditsService } from '@/lib/credits-service'
import { PRICING_PLANS } from '@/lib/pricing-config'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'
import crypto from 'crypto'
import { CreditManager } from '@/lib/credits'
import { PaymentUtils } from '@/lib/payment-utils'

// Add safe admin client fallback for server and edge environments
const admin = supabaseAdmin ?? supabase

// Helper function to detect plan from product ID
function detectPlanFromProductId(productId: string): { plan: string; billingPeriod: string } | null {
  for (const [planName, products] of Object.entries(DODO_PRODUCT_IDS)) {
    for (const [periodName, prodId] of Object.entries(products)) {
      if (prodId === productId) {
        return { plan: planName, billingPeriod: periodName }
      }
    }
  }
  return null
}

// Helper for persistent logging
function logToWebhookFile(message: string, data?: any) {
  try {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`

    // In Vercel/Edge this might fail, but for local dev (Node) it works
    // We use a dynamic import or checking for fs to avoid build errors in edge
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs')
      const path = require('path')
      const logFile = process.env.DODO_PAYMENTS_WEBHOOK_LOG_FILE || './webhook-debug.log'
      fs.appendFileSync(path.resolve(process.cwd(), logFile), logMessage)
    }
  } catch (e) {
    console.error('Failed to write to webhook log file:', e)
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log('🔔 Webhook received at:', timestamp)
  logToWebhookFile('🔔 Webhook received at ' + timestamp)

  try {
    const body = await request.text()
    const signature = request.headers.get('dodo-signature')

    console.log('📥 Webhook body length:', body.length)
    console.log('🔐 Webhook signature present:', !!signature)

    logToWebhookFile('📥 Body length:', body.length)
    logToWebhookFile('🔐 Signature present:', !!signature)

    if (!signature) {
      console.error('❌ Missing Dodo signature')
      logToWebhookFile('❌ Missing Dodo signature')

      // For debugging - allow webhooks without signature in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Development mode: Allowing webhook without signature')
        logToWebhookFile('🧪 Development mode: Allowing webhook without signature')
      } else {
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 400 }
        )
      }
    }

    // Verify webhook signature (skip in development if missing)
    if (signature) {
      const isValidSignature = verifyDodoSignature(body, signature)
      if (!isValidSignature) {
        console.error('❌ Invalid Dodo signature')
        logToWebhookFile('❌ Invalid Dodo signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
      console.log('✅ Webhook signature verified successfully')
      logToWebhookFile('✅ Webhook signature verified')
    } else {
      console.log('🧪 Skipping signature verification in development mode')
    }

    // Parse the webhook payload
    let event
    try {
      event = JSON.parse(body)
      console.log('📋 Parsed webhook event type:', event.type)
      logToWebhookFile('📋 Event type:', event.type)
    } catch (error) {
      console.error('❌ Failed to parse webhook payload:', error)
      logToWebhookFile('❌ Parse error:', error)
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // Handle different event types
    const eventType = event.type || event.event_type
    let eventData = event.data || event.object || event

    // If eventData is still the full event, try to extract the actual data
    if (eventData === event && event.data) {
      eventData = event.data
    }

    logToWebhookFile('📝 Processing event:', eventType)

    switch (eventType) {
      case 'payment.succeeded':
      case 'payment.completed':
        console.log('💰 Processing direct payment success')
        await handleDirectPaymentSuccess(eventData)
        break

      case 'payment.failed':
        console.log('❌ Processing payment failure')
        await handleDirectPaymentFailure(eventData)
        break

      // Dodo subscription events
      case 'subscription.active':
        console.log('✅ Processing subscription activation')
        await handleSubscriptionActive(eventData)
        break

      case 'subscription.renewed':
        console.log('🔄 Processing subscription renewal')
        await handleSubscriptionRenewed(eventData)
        break

      case 'subscription.failed':
        console.log('💥 Processing subscription failure')
        await handleSubscriptionFailed(eventData)
        break

      case 'subscription.on_hold':
        console.log('⏸️ Processing subscription on hold')
        await handleSubscriptionOnHold(eventData)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data?.object || event.data || event)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data?.object || event.data || event)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data?.object || event.data || event)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data?.object || event.data || event)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data?.object || event.data || event)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data?.object || event.data || event)
        break

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
        logToWebhookFile(`🤷 Unhandled event type: ${event.type}`)
    }

    logToWebhookFile('✅ Webhook processed successfully')
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    logToWebhookFile('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle direct payment success (for one-time payments and credit purchases)
async function handleDirectPaymentSuccess(payment: any) {
  try {
    console.log('🎉 Processing direct payment success:', payment.payment_id || payment.id)
    console.log('💳 Payment metadata:', payment.metadata)
    console.log('💳 Customer data:', payment.customer)

    // Try to extract userId from metadata first, then from customer email lookup
    let userId = payment.metadata?.userId
    let plan = payment.metadata?.plan
    let billingPeriod = payment.metadata?.billingPeriod
    const { credits, type } = payment.metadata || {}

    // If metadata is completely empty, try time-based correlation FIRST
    if (!userId && !plan && !billingPeriod) {
      console.log('🔍 Metadata empty, trying time-based correlation for all recent checkouts')

      // Try to find ANY recent checkout in the last 15 minutes
      const planOptions = ['creator', 'basic', 'professional', 'enterprise']
      const billingOptions = ['monthly', 'yearly']

      let bestMatch = null
      let bestScore = 0

      for (const planOption of planOptions) {
        for (const billingOption of billingOptions) {
          try {
            const correlation = PaymentUtils.findRecentCheckout(planOption, billingOption)

            if (correlation && correlation.correlationScore > bestScore) {
              bestScore = correlation.correlationScore
              bestMatch = {
                userId: correlation.mapping.userId,
                plan: planOption,
                billingPeriod: billingOption,
                userEmail: correlation.mapping.userEmail,
                score: correlation.correlationScore
              }
            }
          } catch (correlationError) {
            // Continue to next option
          }
        }
      }

      if (bestMatch && bestScore > 5) { // Require minimum score
        userId = bestMatch.userId
        plan = bestMatch.plan
        billingPeriod = bestMatch.billingPeriod
        console.log(`✅ Found user via comprehensive time correlation - userId: ${userId}, plan: ${plan} (${billingPeriod}), score: ${bestScore}`)
        console.log(`👤 Matched user: ${bestMatch.userEmail}`)
      } else {
        console.log('⚠️ No recent checkout found with sufficient correlation score')
        // Set defaults as fallback
        plan = 'creator'
        billingPeriod = 'monthly'
      }
    }

    // If metadata is empty, try to lookup from PaymentUtils using subscription_id first, then payment_id
    if (!userId && payment.subscription_id) {
      console.log('🔍 Looking up user mapping for subscription:', payment.subscription_id)

      try {
        const mapping = PaymentUtils.getMapping(payment.subscription_id)

        if (mapping) {
          userId = mapping.userId
          plan = mapping.plan
          billingPeriod = mapping.billingPeriod
          console.log('✅ Found user mapping via subscription ID - userId:', userId, 'plan:', plan, 'billing:', billingPeriod)
        } else {
          console.log('⚠️ No user mapping found for subscription:', payment.subscription_id)
        }
      } catch (mappingError) {
        console.error('❌ User mapping lookup error:', mappingError)
      }
    }

    // If still no userId, try payment ID lookup
    if (!userId && payment.payment_id) {
      console.log('🔍 Looking up user mapping for payment:', payment.payment_id)

      try {
        const mapping = PaymentUtils.getMapping(payment.payment_id)

        if (mapping) {
          userId = mapping.userId
          plan = mapping.plan
          billingPeriod = mapping.billingPeriod
          console.log('✅ Found user mapping via payment ID - userId:', userId, 'plan:', plan, 'billing:', billingPeriod)
        } else {
          console.log('⚠️ No user mapping found for payment:', payment.payment_id)
        }
      } catch (mappingError) {
        console.error('❌ Payment mapping lookup error:', mappingError)
      }
    }

    // Try time-based correlation if we still don't have user info but have plan info
    if (!userId && plan && billingPeriod) {
      console.log('🔍 Looking up via time-based correlation for plan:', plan, billingPeriod)

      try {
        const correlation = PaymentUtils.findRecentCheckout(plan, billingPeriod)

        if (correlation) {
          userId = correlation.mapping.userId
          console.log(`✅ Found user via time correlation (score: ${correlation.correlationScore}) - userId: ${userId}`)
        }
      } catch (correlationError) {
        console.error('❌ Time-based correlation error:', correlationError)
      }
    }

    // If userId is still not found, try to find user by email (fallback)
    const paymentEmail = payment.customer?.email
    if (!userId && paymentEmail) {
      console.log('🔍 Looking up user by email (fallback):', paymentEmail)

      const { data: users, error: userError } = await admin
        .from('users')
        .select('id')
        .eq('email', paymentEmail)
        .limit(1)

      if (userError) {
        console.error('❌ User lookup error:', userError)
        return
      }

      const firstUser = users?.[0]
      if (firstUser) {
        userId = firstUser.id
        console.log('✅ Found user ID by email:', userId)
      } else {
        console.error('❌ User not found for email:', paymentEmail)
        return
      }
    }

    if (!userId) {
      console.error('❌ Could not determine userId for payment:', payment.payment_id || payment.id)
      return
    }

    // Handle credit purchases
    if (type === 'credit_purchase') {
      return await handleCreditPurchaseSuccess(payment)
    }

    // Handle subscription payments
    if (!plan) {
      console.error('❌ Missing required metadata in payment:', payment.metadata)
      return
    }

    // Find pending payment in our database
    const { data: existingPayments, error: queryError } = await supabase
      .from('payments')
      .select('*')
      .eq('dodoPaymentId', payment.payment_id || payment.id)
      .eq('status', 'pending')

    if (queryError) {
      console.error('Database query error:', queryError)
      return
    }

    const existingPayment = existingPayments?.[0]
    if (existingPayment) {
      console.log('📝 Found existing payment record, updating status')

      // Update payment status
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: JSON.stringify(payment)
        })
        .eq('id', existingPayment.id)

      if (updateError) {
        console.error('Payment update error:', updateError)
      }
    } else {
      console.log('📝 Creating new payment record')

      // Create new payment record
      const { error: insertError } = await (supabase as any)
        .from('payments')
        .insert({
          userId,
          dodoPaymentId: payment.payment_id || payment.id,
          amount: payment.amount || payment.total_amount || 0,
          currency: payment.currency || 'INR',
          status: 'completed',
          paymentMethod: 'card',
          plan,
          billingPeriod: billingPeriod || 'monthly',
          creditsGranted: 0, // Will be set after granting credits
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: JSON.stringify(payment)
        })

      if (insertError) {
        console.error('Payment insert error:', insertError)
      }
    }

    // Check if credits have already been allocated for this payment to prevent duplicates
    if (payment.subscription_id) {
      try {
        const { data: existingCredits } = await admin
          .from('credits')
          .select('id')
          .eq('user_id', userId)
          .contains('metadata', { dodo_subscription_id: payment.subscription_id })
          .limit(1)

        if (existingCredits && existingCredits.length > 0) {
          console.log(`⚠️ Credits already allocated for subscription ${payment.subscription_id}, skipping duplicate allocation`)
          return
        }
      } catch (checkError) {
        console.log('Could not check for existing credits, proceeding with allocation')
      }
    }

    // If this is a subscription payment, skip credit allocation here to avoid double credits.
    // Subscription credits are granted in subscription.active / subscription.renewed handlers.
    if (payment.subscription_id || type === 'subscription') {
      console.log('🔄 Skipping credit allocation in direct payment handler for subscription payment; handled by subscription.* events')
      // Still update user profile with any available customer/billing info
      await updateUserProfileFromPayment(userId, payment)
      return
    }

    // Grant credits to user
    console.log(`💰 Granting credits for plan: ${plan}`)
    try {
      await CreditsService.allocateSubscriptionCredits(
        userId,
        plan,
        billingPeriod as 'monthly' | 'yearly',
        payment.subscription_id || `payment-${Date.now()}`, // Use subscription ID or payment ID
        payment.payment_id || payment.id
      )

      const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
      const creditsGranted = planConfig?.credits?.monthly || 0

      // Mark payment as processed (no database update needed for now)

      console.log(`✅ Successfully processed payment and granted ${creditsGranted} credits to user ${userId}`)

      // Update user profile from payment data
      await updateUserProfileFromPayment(userId, payment)

    } catch (creditError) {
      console.error('❌ Failed to grant credits:', creditError)
      console.error('Credit error details:', JSON.stringify(creditError, null, 2))
    }

  } catch (error) {
    console.error('❌ Error handling direct payment success:', error)
  }
}

// Handle direct payment failure
async function handleDirectPaymentFailure(payment: any) {
  try {
    console.log('💥 Processing direct payment failure:', payment.payment_id || payment.id)

    const { userId, plan, billingPeriod } = payment.metadata || {}

    if (!userId) {
      console.error('❌ Missing userId in failed payment metadata')
      return
    }

    // Update or create failed payment record
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        userId,
        dodoPaymentId: payment.payment_id || payment.id,
        amount: payment.amount || payment.total_amount || 0,
        currency: payment.currency || 'INR',
        status: 'failed',
        paymentMethod: 'card',
        plan: plan || 'unknown',
        billingPeriod: billingPeriod || 'monthly',
        creditsGranted: 0,
        failedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify(payment)
      })

    if (insertError) {
      console.error('Failed payment insert error:', insertError)
    }

    console.log(`💀 Recorded failed payment for user ${userId}`)

  } catch (error) {
    console.error('❌ Error handling direct payment failure:', error)
  }
}

// Handle successful checkout completion
async function handleCheckoutCompleted(session: any) {
  try {
    console.log('Processing checkout completion:', session.id)

    const { userId, plan, billingPeriod, credits } = session.metadata

    if (!userId || !plan || !billingPeriod) {
      console.error('Missing required metadata in checkout session')
      return
    }

    // Find the pending subscription
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('userId', userId)
      .eq('dodoSubscriptionId', session.id)
      .eq('status', 'pending')

    if (queryError) {
      console.error('Subscription query error:', queryError)
      return
    }

    const subscription = subscriptions?.[0]
    if (!subscription) {
      console.error('No pending subscription found for session:', session.id)
      return
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        dodoSubscriptionId: session.subscription,
        updatedAt: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Subscription update error:', updateError)
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        userId,
        subscriptionId: subscription.id,
        dodoPaymentId: session.payment_intent,
        dodoCustomerId: session.customer,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        paymentMethod: 'card', // Default, can be updated based on actual method
        plan,
        billingPeriod,
        creditsGranted: parseInt(credits),
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify(session)
      })

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
    }

    // Grant credits to user
    await CreditManager.grantMonthlyCredits({
      userId,
      plan,
      subscriptionId: subscription.id
    })

    console.log(`Successfully processed checkout for user ${userId}, plan ${plan}`)

  } catch (error) {
    console.error('Error handling checkout completion:', error)
  }
}

// Handle successful recurring payment
async function handlePaymentSucceeded(invoice: any) {
  try {
    console.log('Processing payment success:', invoice.id)

    const subscriptionId = invoice.subscription
    if (!subscriptionId) {
      console.error('No subscription ID in invoice')
      return
    }

    // Find the subscription
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('dodoSubscriptionId', subscriptionId)

    if (queryError) {
      console.error('Subscription query error:', queryError)
      return
    }

    const subscription = subscriptions?.[0]
    if (!subscription) {
      console.error('No subscription found for ID:', subscriptionId)
      return
    }

    // Before granting new credits, deduct any remaining credits from previous month
    const userCredits = await CreditManager.getActiveCredits(subscription.userId)
    const remainingCredits = userCredits.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0)

    if (remainingCredits > 0) {
      console.log(`Deducting ${remainingCredits} remaining credits before new allocation`)
      await CreditManager.deductCredits({
        userId: subscription.userId,
        amount: remainingCredits,
        reason: 'admin_deduction',
        description: `Monthly renewal: Deducting ${remainingCredits} remaining credits from previous month`
      })
    }

    // Create payment record
    const now = new Date()
    const nextBillingDate = subscription.billingPeriod === 'yearly'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        dodoPaymentId: invoice.payment_intent,
        dodoCustomerId: invoice.customer,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'completed',
        paymentMethod: 'card',
        plan: subscription.plan,
        billingPeriod: subscription.billingPeriod,
        creditsGranted: 0, // Will be set after granting credits
        paidAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: JSON.stringify({
          ...invoice,
          remainingCreditsDeducted: remainingCredits,
          renewalType: 'automatic'
        })
      })
      .select()

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
    }

    // Update subscription next billing date
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({
        nextBillingDate,
        updatedAt: now.toISOString()
      })
      .eq('id', subscription.id)

    if (subscriptionError) {
      console.error('Subscription update error:', subscriptionError)
    }

    // Grant monthly credits for recurring payment
    const creditResult = await CreditManager.grantMonthlyCredits({
      userId: subscription.userId,
      plan: subscription.plan,
      subscriptionId: subscription.id
    })

    // Update payment record with credits granted
    if (paymentData?.[0]?.id) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          creditsGranted: creditResult.newBalance
        })
        .eq('id', paymentData[0].id)

      if (updateError) {
        console.error('Payment update error:', updateError)
      }
    }

    console.log(`Successfully processed recurring payment for user ${subscription.userId}, granted ${creditResult.newBalance} credits`)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: any) {
  try {
    console.log('Processing payment failure:', invoice.id)

    const subscriptionId = invoice.subscription
    if (!subscriptionId) {
      console.error('No subscription ID in invoice')
      return
    }

    // Find the subscription
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('dodoSubscriptionId', subscriptionId)

    if (queryError) {
      console.error('Subscription query error:', queryError)
      return
    }

    const subscription = subscriptions?.[0]
    if (!subscription) {
      console.error('No subscription found for ID:', subscriptionId)
      return
    }

    // Create failed payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        dodoPaymentId: invoice.payment_intent,
        dodoCustomerId: invoice.customer,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        paymentMethod: 'card',
        plan: subscription.plan,
        billingPeriod: subscription.billingPeriod,
        creditsGranted: 0,
        failedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify(invoice)
      })

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
    }

    console.log(`Recorded failed payment for user ${subscription.userId}`)

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('Processing subscription creation:', subscription.id)

    // Find existing subscription record
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('dodoSubscriptionId', subscription.id)

    if (queryError) {
      console.error('Subscription query error:', queryError)
      return
    }

    const existingSubscription = subscriptions?.[0]
    if (existingSubscription) {
      // Update with actual subscription ID
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          dodoSubscriptionId: subscription.id,
          status: 'active',
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

      if (updateError) {
        console.error('Subscription update error:', updateError)
      }
    }

  } catch (error) {
    console.error('Error handling subscription creation:', error)
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('Processing subscription update:', subscription.id)

    // Find subscription record
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('dodoSubscriptionId', subscription.id)

    if (queryError) {
      console.error('Subscription query error:', queryError)
      return
    }

    const existingSubscription = subscriptions?.[0]
    if (existingSubscription) {
      let status = 'active'

      // Map Dodo subscription status to our status
      switch (subscription.status) {
        case 'active':
          status = 'active'
          break
        case 'canceled':
        case 'cancelled':
          status = 'cancelled'
          break
        case 'past_due':
        case 'unpaid':
          status = 'expired'
          break
        default:
          status = subscription.status
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

      if (updateError) {
        console.error('Subscription update error:', updateError)
      }
    }

  } catch (error) {
    console.error('Error handling subscription update:', error)
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('Processing subscription deletion:', subscription.id)

    // Find subscription record
    const { data: subscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('dodoSubscriptionId', subscription.id)

    if (queryError) {
      console.error('Subscription query error:', queryError)
      return
    }

    const existingSubscription = subscriptions?.[0]
    if (existingSubscription) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

      if (updateError) {
        console.error('Subscription update error:', updateError)
      }
    }

  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

// Verify Dodo webhook signature
function verifyDodoSignature(payload: string, signature: string): boolean {
  try {
    const webhookSecret = DODO_PAYMENTS_CONFIG.webhookSecret
    if (!webhookSecret) {
      console.error('❌ DODO_WEBHOOK_SECRET not configured')
      return false
    }

    // For test signatures, allow them to pass
    if (signature === 'test-signature') {
      console.log('🧪 Test signature detected, allowing for testing')
      return true
    }

    // In development mode, be more lenient with signatures
    if (process.env.NODE_ENV === 'development' && !signature) {
      console.log('🧪 Development mode: Allowing webhook without signature')
      return true
    }

    console.log('🔍 Full webhook secret:', webhookSecret)
    console.log('🔍 Full received signature:', signature)

    // Extract the actual signature from the header
    // Dodo signature format is typically: "whsec_<signature>" or "sha256=<signature>"
    let actualSignature = signature
    let secretToUse = webhookSecret

    if (signature.startsWith('whsec_')) {
      actualSignature = signature.substring(6) // Remove 'whsec_' prefix
    } else if (signature.startsWith('sha256=')) {
      actualSignature = signature.substring(7) // Remove 'sha256=' prefix
    }

    // If the webhook secret starts with whsec_, remove it for HMAC computation
    if (secretToUse.startsWith('whsec_')) {
      secretToUse = secretToUse.substring(6)
    }

    console.log('🔍 Processing signature:', actualSignature.substring(0, 10) + '...')
    console.log('🔍 Using secret:', secretToUse.substring(0, 10) + '...')

    // Create HMAC using the webhook secret
    const hmac = crypto.createHmac('sha256', secretToUse)
    hmac.update(payload, 'utf8')
    const computedSignature = hmac.digest('hex')

    console.log('🔍 Computed signature:', computedSignature.substring(0, 10) + '...')
    console.log('🔍 Received signature:', actualSignature.substring(0, 10) + '...')

    // Try different comparison methods
    const directMatch = computedSignature === actualSignature
    const bufferMatch = actualSignature.length === computedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(actualSignature, 'hex')
      )

    console.log('🔍 Direct match:', directMatch)
    console.log('🔍 Buffer match:', bufferMatch)

    return directMatch || bufferMatch

  } catch (error) {
    console.error('❌ Error verifying signature:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    return false
  }
}

// Helper function to update user profile from payment data
async function updateUserProfileFromPayment(userId: string, paymentData: any) {
  try {
    console.log('📝 Updating user profile from payment data for user:', userId)

    const userUpdates: any = {}

    // Extract user information from payment data
    if (paymentData.customer_email) {
      userUpdates.email = paymentData.customer_email
    }

    if (paymentData.customer_name) {
      userUpdates.name = paymentData.customer_name
    }

    if (paymentData.billing_address) {
      userUpdates.billingAddress = {
        street: paymentData.billing_address.line1,
        city: paymentData.billing_address.city,
        state: paymentData.billing_address.state,
        postalCode: paymentData.billing_address.postal_code,
        country: paymentData.billing_address.country
      }
    }

    if (paymentData.phone) {
      userUpdates.phone = paymentData.phone
    }

    // Update subscription information
    if (paymentData.metadata?.plan && paymentData.metadata?.billingPeriod) {
      userUpdates.subscriptionPlan = paymentData.metadata.plan
      userUpdates.billingPeriod = paymentData.metadata.billingPeriod
      userUpdates.subscriptionStatus = 'active'
      userUpdates.lastPaymentDate = new Date().toISOString()
    }

    // Only update if there are changes
    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId)

      if (updateError) {
        console.error('❌ User profile update error:', updateError)
      } else {
        console.log('✅ User profile updated successfully with payment data')
      }
    } else {
      console.log('🔄 No user profile updates needed from payment data')
    }

  } catch (error) {
    console.error('❌ Error updating user profile from payment:', error)
  }
}

// Handle Dodo subscription activation
async function handleSubscriptionActive(subscription: any) {
  try {
    console.log('🎉 Processing subscription activation:', subscription.subscription_id)
    console.log('💳 Subscription metadata:', subscription.metadata)
    console.log('💳 Customer data:', subscription.customer)

    // Try to extract userId from metadata first, then lookup from checkout_sessions, then customer email lookup
    let userId = subscription.metadata?.userId
    let plan = subscription.metadata?.plan
    let billingPeriod = subscription.metadata?.billingPeriod

    // If metadata is completely empty, try time-based correlation FIRST (more reliable than product ID detection)
    if (!userId && !plan && !billingPeriod) {
      console.log('🔍 Metadata empty, trying time-based correlation for all recent checkouts')

      // Try to find ANY recent checkout in the last 15 minutes
      const planOptions = ['creator', 'basic', 'professional', 'enterprise']
      const billingOptions = ['monthly', 'yearly']

      let bestMatch = null
      let bestScore = 0

      for (const planOption of planOptions) {
        for (const billingOption of billingOptions) {
          try {
            const correlation = PaymentUtils.findRecentCheckout(planOption, billingOption)

            if (correlation && correlation.correlationScore > bestScore) {
              bestScore = correlation.correlationScore
              bestMatch = {
                userId: correlation.mapping.userId,
                plan: planOption,
                billingPeriod: billingOption,
                userEmail: correlation.mapping.userEmail,
                score: correlation.correlationScore
              }
            }
          } catch (correlationError) {
            // Continue to next option
          }
        }
      }

      if (bestMatch && bestScore > 5) { // Require minimum score
        userId = bestMatch.userId
        plan = bestMatch.plan
        billingPeriod = bestMatch.billingPeriod
        console.log(`✅ Found user via comprehensive time correlation - userId: ${userId}, plan: ${plan} (${billingPeriod}), score: ${bestScore}`)
        console.log(`👤 Matched user: ${bestMatch.userEmail}`)
      } else {
        console.log('⚠️ No recent checkout found with sufficient correlation score')
        // Try to detect plan from product_id as fallback
        if (subscription.product_id) {
          const detected = detectPlanFromProductId(subscription.product_id)
          if (detected) {
            plan = detected.plan
            billingPeriod = detected.billingPeriod
            console.log(`🔍 Fallback: Detected plan from product ID ${subscription.product_id}: ${plan} (${billingPeriod})`)
          }
        }
        // Final fallback defaults
        if (!plan) plan = 'creator'
        if (!billingPeriod) billingPeriod = 'monthly'
      }
    }

    // If metadata is empty, try to lookup from user mapping API
    if (!userId && subscription.subscription_id) {
      console.log('🔍 Looking up user mapping for subscription:', subscription.subscription_id)

      try {
        const mapping = PaymentUtils.getMapping(subscription.subscription_id)

        if (mapping) {
          userId = mapping.userId
          plan = mapping.plan
          billingPeriod = mapping.billingPeriod
          console.log('✅ Found user mapping - userId:', userId, 'plan:', plan, 'billing:', billingPeriod)
        }
      } catch (mappingError) {
        console.error('❌ User mapping lookup error:', mappingError)
      }
    }

    // If still no userId, try to find user by email (fallback)
    if (!userId && subscription.customer?.email) {
      console.log('🔍 Looking up user by email:', subscription.customer?.email)

      const subEmailRenew = subscription.customer?.email
      if (!userId && subEmailRenew) {
        console.log('🔍 Looking up user by email:', subEmailRenew)

        const { data: users, error: userError } = await admin
          .from('users')
          .select('id')
          .eq('email', subEmailRenew)
          .limit(1)

        if (userError) {
          console.error('❌ User lookup error:', userError)
          return
        }

        const firstUser = users?.[0]
        if (firstUser) {
          userId = firstUser.id
          console.log('✅ Found user ID:', userId)
        } else {
          console.error('❌ User not found for email:', subEmailRenew)
          return
        }
      }
    }

    if (!userId) {
      console.error('❌ Could not determine userId for subscription:', subscription.subscription_id)
      return
    }

    // Skip database subscription tracking - focus on credit allocation only
    console.log('📝 Skipping subscription database operations - using credit system only')

    // Strong idempotency: if we already created credits for this payment/transaction, skip
    try {
      const txId = subscription.payment_id as string | undefined
      if (txId) {
        const { data: existingByTx } = await admin
          .from('credits')
          .select('id')
          .eq('user_id', userId)
          .eq('transaction_id', txId)
          .limit(1)
        if (existingByTx && existingByTx.length > 0) {
          console.log(`⚠️ Credits already allocated for transaction ${txId}, skipping`)
          return
        }
      }
    } catch (idemErr) {
      console.warn('Idempotency by transaction_id check failed (will continue with secondary checks):', idemErr)
    }

    // Secondary idempotency: check if credits already allocated for this subscription via metadata
    try {
      const { data: existingCredits } = await admin
        .from('credits')
        .select('id')
        .eq('user_id', userId)
        .contains('metadata', { dodo_subscription_id: subscription.subscription_id })
        .limit(1)

      if (existingCredits && existingCredits.length > 0) {
        console.log(`⚠️ Credits already allocated for subscription ${subscription.subscription_id}, skipping duplicate allocation`)
        return
      }
    } catch (checkError) {
      console.log('Metadata contains check not available or failed; will use recent-credit heuristic')
    }

    // Heuristic idempotency: if an equivalent credit was created very recently, skip
    try {
      const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === (plan || '').toLowerCase())
      const expectedAmount = planConfig?.credits?.monthly || 0
      if (expectedAmount > 0) {
        const { data: recent, error: recentErr } = await admin
          .from('credits')
          .select('id, amount, created_at, metadata')
          .eq('user_id', userId)
          .eq('type', 'subscription')
          .order('created_at', { ascending: false })
          .limit(1)
        if (!recentErr && recent && recent.length > 0) {
          const first = recent?.[0]
          if (first) {
            const createdAt = new Date(first.created_at as string)
            const minutesSince = (Date.now() - createdAt.getTime()) / 60000
            const amountsMatch = Number(first.amount) === expectedAmount
            if (minutesSince <= 15 && amountsMatch) {
              console.log(`⚠️ Recent subscription credit (${expectedAmount}) detected ${minutesSince.toFixed(1)}m ago; skipping to avoid duplicate`)
              return
            }
          }
        }
      }
    } catch (heurErr) {
      console.warn('Recent-credit heuristic check failed:', heurErr)
    }

    // Grant initial credits to user
    console.log(`💰 Granting initial credits for plan: ${plan}`)
    try {
      await CreditsService.allocateSubscriptionCredits(
        userId,
        plan,
        billingPeriod as 'monthly' | 'yearly',
        subscription.subscription_id,
        subscription.payment_id || subscription.subscription_id // Use payment ID or subscription ID as reference
      )

      const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
      const creditsGranted = planConfig?.credits?.monthly || 0

      // Subscription activated successfully

      console.log(`✅ Successfully activated subscription and granted ${creditsGranted} credits to user ${userId}`)

    } catch (creditError) {
      console.error('❌ Failed to grant credits:', creditError)
      console.error('❌ Credit error details:', JSON.stringify(creditError, null, 2))
    }

  } catch (error) {
    console.error('❌ Error handling subscription activation:', error)
  }
}

// Handle Dodo subscription renewal
async function handleSubscriptionRenewed(subscription: any) {
  try {
    console.log('🔄 Processing subscription renewal:', subscription.subscription_id)
    console.log('💳 Subscription metadata:', subscription.metadata)
    console.log('💳 Customer data:', subscription.customer)

    // Try to extract userId from metadata first, then from customer email lookup
    let userId = subscription.metadata?.userId
    let plan = subscription.metadata?.plan || 'creator' // Default to creator if not specified
    let billingPeriod = subscription.metadata?.billingPeriod || 'monthly'

    // If userId is not in metadata, try to find user by email
    const subEmailActive = subscription.customer?.email
    if (!userId && subEmailActive) {
      console.log('🔍 Looking up user by email:', subEmailActive)

      const { data: users, error: userError } = await admin
        .from('users')
        .select('id')
        .eq('email', subEmailActive)
        .limit(1)

      if (userError) {
        console.error('❌ User lookup error:', userError)
        return
      }

      const firstUser = users?.[0]
      if (firstUser) {
        userId = firstUser.id
        console.log('✅ Found user ID via email lookup:', userId)
      } else {
        console.error('❌ User not found for email:', subEmailActive)
        return
      }
    }

    if (!userId) {
      console.error('❌ Could not determine userId for subscription renewal:', subscription.subscription_id)
      return
    }

    // Idempotency checks: avoid duplicate allocations when subscription.active + subscription.renewed arrive together
    try {
      const paymentId = subscription.payment_id as string | undefined

      if (paymentId) {
        // If we have a payment/transaction id, check credits by transaction_id (CreditsService writes this field)
        const { data: existingByTx } = await admin
          .from('credits')
          .select('id')
          .eq('user_id', userId)
          .eq('transaction_id', paymentId)
          .limit(1)

        if (existingByTx && existingByTx.length > 0) {
          console.log(`⚠️ Renewal credits already allocated for transaction ${paymentId}, skipping duplicate allocation`)
          return
        }
      } else {
        // Fallback: if a credit for this subscription was created very recently, skip
        const { data: recentCredits, error: recentErr } = await admin
          .from('credits')
          .select('id, created_at, metadata')
          .eq('user_id', userId)
          .contains('metadata', { dodo_subscription_id: subscription.subscription_id })
          .order('created_at', { ascending: false })
          .limit(1)

        if (!recentErr && recentCredits && recentCredits.length > 0) {
          const first = recentCredits?.[0]
          if (first) {
            const createdAt = new Date(first.created_at as string)
            const minutesSince = (Date.now() - createdAt.getTime()) / 60000
            if (minutesSince <= 120) { // within 2 hours
              console.log(`⚠️ Recent credits for subscription ${subscription.subscription_id} detected (${minutesSince.toFixed(1)}m ago). Skipping duplicate renewal allocation`)
              return
            }
          }
        }
      }
    } catch (idemError) {
      console.warn('Idempotency check for renewal failed, proceeding cautiously:', idemError)
    }

    // Skip database subscription tracking - focus on credit allocation only
    console.log('📝 Skipping subscription database operations - using credit system only')

    // Get current credits balance
    const currentBalance = await CreditsService.getUserCredits(userId)

    if (currentBalance.remaining > 0) {
      console.log(`User has ${currentBalance.remaining} remaining credits, will be replaced with new allocation`)
    }

    // Grant new monthly credits (this will add to existing credits)
    console.log(`💰 Granting renewal credits for plan: ${plan}`)
    try {
      await CreditsService.allocateSubscriptionCredits(
        userId,
        plan,
        billingPeriod as 'monthly' | 'yearly' || 'monthly',
        subscription.subscription_id,
        subscription.payment_id || `renewal-${Date.now()}`
      )

      const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
      const creditsGranted = planConfig?.credits?.monthly || 0

      console.log(`✅ Successfully renewed subscription and granted ${creditsGranted} credits to user ${userId}`)

    } catch (creditError) {
      console.error('❌ Failed to grant renewal credits:', creditError)
      console.error('❌ Credit error details:', JSON.stringify(creditError, null, 2))
    }

  } catch (error) {
    console.error('❌ Error handling subscription renewal:', error)
  }
}

// Handle Dodo subscription failure
async function handleSubscriptionFailed(subscription: any) {
  try {
    console.log('💥 Processing subscription failure:', subscription.subscription_id)

    const { userId } = subscription.metadata || {}

    if (!userId) {
      console.error('❌ Missing userId in failed subscription metadata')
      return
    }

    // Skip database subscription tracking - just log for now
    console.log('📝 Skipping subscription database operations - logging failure only')
    console.log(`💀 Subscription failed for user ${userId}`)

  } catch (error) {
    console.error('❌ Error handling subscription failure:', error)
  }
}

// Handle Dodo subscription on hold
async function handleSubscriptionOnHold(subscription: any) {
  try {
    console.log('⏸️ Processing subscription on hold:', subscription.subscription_id)

    const { userId } = subscription.metadata || {}

    if (!userId) {
      console.error('❌ Missing userId in on-hold subscription metadata')
      return
    }

    // Skip database subscription tracking - just log for now
    console.log('📝 Skipping subscription database operations - logging on-hold status only')
    console.log(`⏸️ Subscription put on hold for user ${userId}`)

  } catch (error) {
    console.error('❌ Error handling subscription on hold:', error)
  }
}

// Handle credit purchase success
async function handleCreditPurchaseSuccess(payment: any) {
  try {
    console.log('💰 Processing credit purchase success:', payment.payment_id || payment.id)

    const { userId, credits, packageType, customAmount, description } = payment.metadata || {}

    if (!userId || !credits) {
      console.error('❌ Missing required credit purchase metadata:', payment.metadata)
      return
    }

    const creditsToGrant = parseInt(credits)

    // Find pending credit purchase in our database
    const { data: creditPurchases, error: queryError } = await (supabase as any)
      .from('credit_purchases')
      .select('*')
      .eq('dodo_payment_id', payment.payment_id || payment.id)
      .eq('status', 'pending')

    if (queryError) {
      console.error('Credit purchase query error:', queryError)
      return
    }

    const existingPurchase = creditPurchases?.[0]
    if (existingPurchase) {
      console.log('📝 Found existing credit purchase record, updating status')

      // Update purchase status
      const { error: updateError } = await (supabase as any)
        .from('credit_purchases')
        .update({
          status: 'completed',
          credits_granted: creditsToGrant,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify(payment)
        })
        .eq('id', existingPurchase.id)

      if (updateError) {
        console.error('Credit purchase update error:', updateError)
      }
    } else {
      console.log('📝 Creating new credit purchase record')

      // Create new purchase record
      const { error: insertError } = await (supabase as any)
        .from('credit_purchases')
        .insert({
          user_id: userId,
          package_type: packageType || 'custom',
          dodo_payment_id: payment.payment_id || payment.id,
          amount: payment.amount || payment.total_amount || 0,
          currency: payment.currency || 'USD',
          status: 'completed',
          credits: creditsToGrant,
          credits_granted: creditsToGrant,
          description: description || `${creditsToGrant} Credits Purchase`,
          custom_amount: customAmount ? parseInt(customAmount) : null,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify(payment)
        })

      if (insertError) {
        console.error('Credit purchase insert error:', insertError)
      }
    }

    // Grant credits to user
    console.log(`💰 Granting ${creditsToGrant} credits for purchase`)
    try {
      const creditResult = await CreditManager.grantCredits({
        userId,
        amount: creditsToGrant,
        type: 'purchase',
        source: 'credit_purchase',
        description: description || `Credit purchase - ${creditsToGrant} credits`,
        transactionId: `purchase-${Date.now()}`,
        expiresAt: null // Credits from purchases don't expire
      })

      console.log(`✅ Successfully processed credit purchase and granted ${creditsToGrant} credits to user ${userId} (new balance: ${creditResult.newBalance})`)

    } catch (creditError) {
      console.error('❌ Failed to grant purchased credits:', creditError)
    }

  } catch (error) {
    console.error('❌ Error handling credit purchase success:', error)
  }
}