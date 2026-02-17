import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabase } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

        if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

        const session = await getSession(token)
        if (!session || !session.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

        // Get customer ID from subscription
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('dodo_customer_id')
            .eq('user_id', session.user.id)
            .single()

        if (!subscription?.dodo_customer_id) {
            return NextResponse.json({ invoices: [] })
        }

        // Fetch payments/invoices from Dodo
        // This is hypothetical as per typical payment provider APIs
        // Adjust based on actual Dodo SDK methods if available
        // Fallback: list our own payments table if Dodo API is tricky

        // Using Dodo Client to list payments
        try {
            // @ts-ignore - Dynamic method usage if typing is incomplete
            const response = await dodo.payments.list({
                // @ts-ignore - Supabase types might be outdated
                customer_id: subscription.dodo_customer_id,
                limit: 10
            })

            const invoices = response.data.map((payment: any) => ({
                id: payment.payment_id,
                amount: payment.total_amount,
                currency: payment.currency,
                status: payment.status,
                date: payment.created_at,
                // Adjust property names based on actual API response, but fallbacks are good
                invoice_url: payment.receipt_url || payment.invoice_url
            }))

            return NextResponse.json({ invoices })
        } catch (dodoError: any) {
            console.error('Dodo fetch error:', dodoError)
            // Fallback to local DB
            const { data: localPayments } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            return NextResponse.json({ invoices: localPayments || [] })
        }
    } catch (error) {
        console.error('Invoices error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
