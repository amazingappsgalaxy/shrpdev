import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { SubscriptionService } from '@/lib/subscription-service'

export async function GET(request: NextRequest) {
    try {
        // Get user session
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('session')?.value

        if (!sessionToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const session = await getSession(sessionToken)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Get subscription status
        const status = await SubscriptionService.getUserSubscription(userId)

        return NextResponse.json({
            success: true,
            ...status
        })
    } catch (error) {
        console.error('Error fetching subscription:', error)
        return NextResponse.json(
            { error: 'Failed to fetch subscription' },
            { status: 500 }
        )
    }
}
