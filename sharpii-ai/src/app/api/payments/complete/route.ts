import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'
import { CreditsService } from '@/lib/credits-service'

const admin = supabaseAdmin

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const session = await getSession(token)
    if (!session?.user?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await request.json().catch(() => ({} as any))
    const subscriptionId = body.subscriptionId || body.subscription_id

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 })
    }

    const providerSubscription: any = await (dodo as any).subscriptions.retrieve(subscriptionId)

    const providerUserId =
      providerSubscription?.metadata?.userId ||
      providerSubscription?.metadata?.user_id ||
      providerSubscription?.customer?.metadata?.userId ||
      providerSubscription?.customer?.metadata?.user_id ||
      null
    const providerEmail =
      providerSubscription?.customer?.email ||
      providerSubscription?.metadata?.user_email ||
      providerSubscription?.customer?.metadata?.user_email ||
      null

    if (providerUserId && providerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!providerUserId && providerEmail && session.user.email && providerEmail !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!providerUserId && !providerEmail) {
      return NextResponse.json({ error: 'Unable to verify subscription ownership' }, { status: 403 })
    }

    const plan = providerSubscription?.metadata?.plan || providerSubscription?.plan || 'creator'
    const billingPeriodRaw = providerSubscription?.metadata?.billingPeriod || providerSubscription?.billing_period || 'monthly'
    const billingPeriod =
      billingPeriodRaw === 'daily' || billingPeriodRaw === 'monthly' || billingPeriodRaw === 'yearly'
        ? billingPeriodRaw
        : 'monthly'

    const nextBillingDate = providerSubscription?.next_billing_date || providerSubscription?.current_period_end || null
    const cancelAtNextBilling = !!providerSubscription?.cancel_at_next_billing_date
    const subscriptionStatus = cancelAtNextBilling ? 'pending_cancellation' : 'active'

    if (admin) {
      await admin.from('subscriptions').upsert(
        {
          user_id: session.user.id,
          plan,
          status: subscriptionStatus,
          billing_period: billingPeriod,
          dodo_subscription_id: providerSubscription?.subscription_id || subscriptionId,
          dodo_customer_id: providerSubscription?.customer?.customer_id || providerSubscription?.customer_id || null,
          next_billing_date: nextBillingDate,
          billing_name: providerSubscription?.customer?.name || providerSubscription?.metadata?.user_name || null,
          billing_email: providerSubscription?.customer?.email || providerSubscription?.metadata?.user_email || null,
          billing_address: providerSubscription?.billing || providerSubscription?.customer?.billing || null,
          currency: providerSubscription?.currency || 'USD',
          amount: providerSubscription?.recurring_pre_tax_amount || providerSubscription?.amount || 0,
          start_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }

    let transactionId = providerSubscription?.latest_payment_id || providerSubscription?.payment_id
    if (nextBillingDate) {
      const dateStr = new Date(nextBillingDate).toISOString().split('T')[0]
      transactionId = `sub_period_${subscriptionId}_${dateStr}`
    } else {
      transactionId = transactionId || `sub-${subscriptionId}`
    }

    const creditsResult = await CreditsService.allocateSubscriptionCredits(
      session.user.id,
      plan,
      billingPeriod,
      subscriptionId,
      transactionId
    )

    if (admin) {
      try {
        let count = 0
        for await (const item of (dodo as any).payments.list({ subscription_id: subscriptionId })) {
          const payment: any = item
          const paymentId = payment.payment_id || payment.id
          if (!paymentId) continue

          const { data: existingPayment } = await admin
            .from('payments')
            .select('id')
            .eq('dodo_payment_id', paymentId)
            .limit(1)
            .maybeSingle()

          if (!existingPayment?.id) {
            await admin.from('payments').insert({
              user_id: session.user.id,
              dodo_payment_id: paymentId,
              dodo_customer_id: payment.customer?.customer_id || payment.customer_id || null,
              amount: payment.total_amount ?? payment.amount ?? 0,
              currency: payment.currency || 'USD',
              status: payment.status || 'succeeded',
              payment_method: payment.payment_method || payment.payment_method_type || null,
              plan,
              billing_period: billingPeriod,
              paid_at: payment.paid_at || payment.created_at || new Date().toISOString(),
              created_at: payment.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: payment,
            })
          }

          count += 1
          if (count >= 10) break
        }
      } catch {
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        status: subscriptionStatus,
        plan,
        billingPeriod,
        next_billing_date: nextBillingDate,
        cancel_at_next_billing_date: cancelAtNextBilling,
      },
      credits: creditsResult,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to complete subscription', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
