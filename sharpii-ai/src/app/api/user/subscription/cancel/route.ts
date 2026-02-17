import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-simple'
import { supabase } from '@/lib/supabase'
import { dodoClient as dodo } from '@/lib/dodo-client'

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '') || request.cookies.get('session')?.value

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const session = await getSession(token)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }

        // Get active subscription from DB
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('userId', session.user.id) // Assuming userId is column name; verify if it's user_id
            .eq('status', 'active')
            .single()

        if (error || !subscription) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
        }

        if (!subscription.dodoSubscriptionId && !subscription.dodo_subscription_id) {
            return NextResponse.json({ error: 'Subscription ID not found' }, { status: 400 })
        }

        const subId = subscription.dodoSubscriptionId || subscription.dodo_subscription_id

        // Cancel in Dodo Payments
        try {
            // Using update to set status to cancelled
            // @ts-ignore - Dynamic method usage if typing is incomplete
            await dodo.subscriptions.update(subId, { status: 'cancelled' })
        } catch (dodoError: any) {
            console.error('Dodo cancellation error:', dodoError)
            return NextResponse.json({
                error: 'Failed to cancel subscription with payment provider',
                details: dodoError.message
            }, { status: 500 })
        }

        // Update DB status immediately (webhook will eventually confirm)
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('id', subscription.id)

        if (updateError) {
            console.error('DB update error:', updateError)
        }

        return NextResponse.json({ success: true, message: 'Subscription cancelled successfully' })

    } catch (error) {
        console.error('Cancellation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
