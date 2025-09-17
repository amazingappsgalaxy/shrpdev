import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS, type PlanType, type BillingPeriod } from '@/lib/dodo-payments-config'
import { PRICING_PLANS } from '@/lib/pricing-config'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function POST(request: NextRequest) {
  console.log('🚀 [CHECKOUT API] Starting payment checkout request')
  
  try {
    const { plan, billingPeriod } = await request.json()
    console.log('📋 [CHECKOUT API] Request data:', { plan, billingPeriod })
    
    // Validate input
    if (!plan || !billingPeriod) {
      return NextResponse.json(
        { error: 'Plan and billing period are required' },
        { status: 400 }
      )
    }
    
    // Validate plan exists in PRICING_PLANS
    const validPlans = ['basic', 'creator', 'professional', 'enterprise']
    if (!validPlans.includes(plan.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }
    
    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'Invalid billing period' },
        { status: 400 }
      )
    }
    
    // Get user session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const session = await getSession(token)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    const userId = session.user.id
    
    // Get plan configuration from PRICING_PLANS
    const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
    if (!planConfig) {
      return NextResponse.json(
        { error: `Plan configuration not found for plan: ${plan}` },
        { status: 400 }
      )
    }
    
    const amount = planConfig.price[billingPeriod as 'monthly' | 'yearly']
    const productId = DODO_PRODUCT_IDS[plan.toLowerCase() as PlanType][billingPeriod as BillingPeriod]
    console.log('DEBUG - Plan:', plan, 'Period:', billingPeriod, 'Amount:', amount, 'Amount in cents:', amount * 100)
    console.log('🛍️ [CHECKOUT API] Using product ID:', productId)

    // Validate amount
    if (!amount || amount <= 0) {
      console.error('❌ [CHECKOUT API] Invalid amount:', amount)
      return NextResponse.json(
        { error: `Invalid plan amount: ${amount}` },
        { status: 400 }
      )
    }

    // Validate product mapping to avoid broken checkout links
    if (!productId) {
      console.error('❌ [CHECKOUT API] Missing Dodo product ID mapping for', { plan, billingPeriod })
      return NextResponse.json(
        {
          error: 'Payment configuration error',
          message: `Missing Dodo product ID for ${plan} (${billingPeriod}).`,
          nextSteps: [
            'Create Subscription products in your Dodo dashboard for each plan/period',
            'Set DODO_*_PRODUCT_ID environment variables (e.g., DODO_CREATOR_MONTHLY_PRODUCT_ID)',
            'Restart the server and try again'
          ],
          debug: {
            plan,
            billingPeriod
          }
        },
        { status: 500 }
      )
    }

    // Create subscription with metadata and generate custom checkout URL
    try {
      console.log('🚀 [CHECKOUT API] Creating subscription with metadata')
      console.log('📋 [CHECKOUT API] Request data:', { plan, billingPeriod })
      console.log('💰 [CHECKOUT API] Plan amount:', amount, 'cents:', amount * 100)

      // Use tunnel URL or request origin as fallback
      const origin = new URL(request.url).origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin
      const successUrl = process.env.DODO_PAYMENTS_RETURN_URL || `${baseUrl}/app/dashboard?payment=success`
      const cancelUrl = process.env.DODO_PAYMENTS_CANCEL_URL || `${baseUrl}/?payment=cancelled#pricing-section`

      // Create subscription with Dodo API with timeout
      const subscriptionData = {
        billing: {
          city: 'San Francisco',
          country: 'US' as const,
          state: 'CA',
          street: '123 Main St',
          zipcode: '94105'
        },
        customer: {
          email: session.user.email as string,
          name: (session.user.name || session.user.email) as string
        },
        product_id: productId,
        quantity: 1,
        return_url: successUrl,
        metadata: {
          userId,
          plan,
          billingPeriod,
          type: 'subscription',
          credits: planConfig.credits.monthly?.toString() || '0',
          success_url: successUrl,
          cancel_url: cancelUrl,
          user_email: session.user.email as string,
          user_name: (session.user.name || session.user.email) as string
        }
      }

      console.log('📤 [CHECKOUT API] Creating subscription with data:', JSON.stringify(subscriptionData, null, 2))

      // Add timeout wrapper for Dodo API call
      const createSubscriptionWithTimeout = () => {
        return Promise.race([
          dodo.subscriptions.create(subscriptionData),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Dodo API call timed out after 15 seconds')), 15000)
          )
        ])
      }

      const subscription = await createSubscriptionWithTimeout()
      console.log('✅ [CHECKOUT API] Created subscription:', subscription)

      // Store user mapping in memory (temporary solution)
      try {
        const localPort = new URL(request.url).port || '3004'
        const mappingResponse = await fetch(`http://localhost:${localPort}/api/payments/user-mapping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'store',
            subscriptionId: subscription.subscription_id,
            userId: userId,
            plan: plan,
            billingPeriod: billingPeriod,
            userEmail: session.user.email as string,
            userName: (session.user.name || session.user.email) as string,
            paymentId: subscription.payment_id
          })
        })

        if (mappingResponse.ok) {
          console.log('✅ Stored user mapping for subscription:', subscription.subscription_id)
        } else {
          console.error('❌ Failed to store user mapping')
        }
      } catch (mappingError) {
        console.error('❌ Error storing user mapping:', mappingError)
        // Continue anyway, we have fallback user lookup
      }

      // Create custom checkout URL with metadata parameters
      const metadataParams = new URLSearchParams({
        'metadata_userId': userId,
        'metadata_plan': plan,
        'metadata_billingPeriod': billingPeriod,
        'metadata_type': 'subscription',
        'metadata_user_email': session.user.email as string,
        'metadata_user_name': (session.user.name || session.user.email) as string,
        'customer_email': session.user.email as string,
      })

      // Use the subscription's payment_link or generate a checkout URL with metadata
      const checkoutUrl = subscription.payment_link
        ? `${subscription.payment_link}?${metadataParams.toString()}`
        : `https://test.checkout.dodopayments.com/buy/${productId}?${metadataParams.toString()}`

      console.log('🔗 [CHECKOUT API] Generated checkout URL:', checkoutUrl)

      return NextResponse.json({
        success: true,
        checkoutUrl,
        paymentId: subscription.payment_id,
        subscriptionId: subscription.subscription_id,
        clientSecret: subscription.client_secret,
        metadata: {
          successUrl,
          cancelUrl,
          userId,
          plan,
          billingPeriod
        }
      })
      
    } catch (error: any) {
      console.error('❌ [CHECKOUT API] Error creating subscription:', error)
      try { console.error('Error details:', JSON.stringify(error, null, 2)) } catch {}
      
      if (error?.status === 401) {
        return NextResponse.json(
          {
            error: 'Payment system configuration error',
            message: 'Invalid Dodo Payments API key. Please contact support or check the API configuration.'
          },
          { status: 500 }
        )
      }

      if (error?.status === 404) {
        return NextResponse.json(
          {
            error: 'Payment configuration error',
            message: 'Dodo Payments product not found (404).',
            details:
              'Verify DODO_*_PRODUCT_ID env vars map to valid test-mode products in your Dodo dashboard, or update fallbacks in dodo-payments-config.ts. Also ensure the currency matches the product configuration.'
          },
          { status: 500 }
        )
      }

      // Handle timeout error specifically
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('timed out')) {
        return NextResponse.json(
          {
            error: 'Payment service timeout',
            message: 'The payment service is currently slow to respond. Please try again in a moment.',
            details: errorMessage
          },
          { status: 408 }
        )
      }

      return NextResponse.json(
        { error: `Failed to create subscription: ${errorMessage}` },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method to retrieve checkout session status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Get user session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const session = await getSession(token)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    // Query our database for the checkout session
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('dodoSubscriptionId', sessionId)
        .eq('userId', session.user.id)
      
      if (error) {
        console.error('Error querying subscriptions:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
      
      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
      }
      
      const subscription = subscriptions?.[0]
      if (!subscription) {
        return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
      }

      return NextResponse.json({
        status: subscription.status,
        sessionId: subscription.dodoSubscriptionId,
        customerId: subscription.dodoCustomerId,
        subscriptionId: subscription.id
      })
      
    } catch (error) {
      console.error('Error retrieving checkout session:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve checkout session' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Checkout status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}