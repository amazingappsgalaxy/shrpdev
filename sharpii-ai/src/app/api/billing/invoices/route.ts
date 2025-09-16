import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user session using better-auth
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers) as Record<string, string>
    })

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get completed checkout sessions for the user to generate invoices
    const { data: checkoutData, error: checkoutError } = await (supabase as any)
      .from('checkout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)

    if (checkoutError) {
      console.error('Checkout sessions error:', checkoutError)
    }

    // Convert checkout sessions to invoice format
    const invoices = (checkoutData || []).map((session: any) => ({
      id: session.id,
      paymentId: session.subscription_id,
      invoiceNumber: `INV-${session.id.slice(-8).toUpperCase()}`,
      amount: session.amount,
      currency: session.currency,
      status: 'paid',
      issuedAt: new Date(session.created_at).getTime(),
      dueAt: new Date(session.updated_at || session.created_at).getTime(),
      downloadUrl: `/api/billing/invoice/${session.subscription_id}/download`,
      plan: session.plan,
      billingPeriod: session.billing_period,
      userEmail: session.user_email
    }))

    return NextResponse.json({
      success: true,
      invoices,
      total: invoices.length,
      totalAmount: invoices.reduce((sum: number, invoice: any) => sum + invoice.amount, 0)
    })

  } catch (error) {
    console.error('Billing invoices error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get invoices',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}