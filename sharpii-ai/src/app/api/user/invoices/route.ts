import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

        if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

        const session = await getSession(token)
        if (!session || !session.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

        // Get payment history from the payments table (primary source of truth)
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching payments:', error)
            return NextResponse.json({ invoices: [] })
        }

        // Map payments to invoice format for the frontend
        const invoices = (payments || []).map((p: any) => ({
            id: p.dodo_payment_id || p.id,
            amount: p.amount,
            currency: p.currency || 'USD',
            status: p.status,
            date: p.paid_at || p.created_at,
            created_at: p.created_at,
            plan: p.plan,
            billing_period: p.billing_period,
            payment_method: p.payment_method,
            invoice_url: p.invoice_url || p.metadata?.invoice_url || p.metadata?.receipt_url || null
        }))

        return NextResponse.json({ invoices })
    } catch (error) {
        console.error('Invoices error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
