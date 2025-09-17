import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/simple-auth'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

const supabase = createClient(config.database.supabaseUrl!, config.database.supabaseServiceKey!)

export async function GET(request: NextRequest) {
  try {
    // Use simple auth method first (more reliable)
    let userId: string | null = null

    const bearer = request.headers.get('authorization')?.replace('Bearer ', '')
    const cookieToken = request.cookies.get('session')?.value
    const token = bearer || cookieToken

    if (token) {
      const simple = await getSession(token)
      if (simple?.user) {
        userId = (simple.user as any).id
      }
    }

    // Fallback to auth.api.getSession if simple auth fails
    if (!userId) {
      try {
        const session = await auth.api.getSession({
          headers: Object.fromEntries(request.headers) as Record<string, string>
        })
        if (session?.user?.id && session.user.id !== 'mock-user-id') {
          userId = session.user.id
        }
      } catch (e) {
        // ignore fallback failure
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all credit transactions from credits table
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (creditsError) {
      console.error('Error fetching credit history:', creditsError)
      return NextResponse.json({ error: 'Failed to fetch credit history' }, { status: 500 })
    }

    // Get subscription information for better descriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id, plan, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')

    // Get payment information for credit purchases
    const { data: payments } = await supabase
      .from('payments')
      .select('id, plan, credits_granted, created_at, status')
      .eq('user_id', userId)
      .eq('status', 'completed')

    const history = (credits || []).map((credit: any) => {
      const amount = credit.amount || 0
      const isCredit = amount > 0
      const isDeduction = amount < 0

      let description = ''
      let displayName = ''
      let expiryInfo = null

      // Determine the type and description based on source and amount
      if (isCredit) {
        // Credit addition
        switch (credit.source) {
          case 'subscription_renewal':
          case 'monthly_allocation':
            const plan = credit.metadata ? JSON.parse(credit.metadata)?.plan || 'Creator' : 'Creator'
            displayName = `${plan} Plan`
            description = `Monthly subscription credits from ${plan} plan`

            // Calculate expiry date (30 days from created_at)
            if (credit.expires_at && credit.expires_at !== '9999-12-31T23:59:59.999Z') {
              expiryInfo = {
                expires: new Date(credit.expires_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              }
            }
            break

          case 'credit_purchase':
          case 'purchase':
            displayName = 'Credit Purchase'
            description = 'Permanent credits purchased'
            break

          case 'bonus':
            displayName = 'Bonus Credits'
            description = 'Bonus credits awarded'
            break

          case 'admin_grant':
            displayName = 'Admin Grant'
            description = 'Credits granted by admin'
            break

          default:
            displayName = 'Credits Added'
            description = 'Credits added to account'
        }
      } else {
        // Credit deduction
        switch (credit.source) {
          case 'image_enhancement':
            displayName = 'Image Enhancement'
            description = 'Credits used for image enhancement'
            break

          case 'api_usage':
            displayName = 'API Usage'
            description = 'Credits used for API calls'
            break

          default:
            displayName = 'Credits Used'
            description = 'Credits deducted from account'
        }
      }

      return {
        id: credit.id,
        amount: Math.abs(amount),
        type: isCredit ? 'credit' : 'debit',
        displayName,
        description,
        source: credit.source,
        created_at: credit.created_at,
        createdAt: new Date(credit.created_at).getTime(),
        expiryInfo,
        metadata: credit.metadata || null,
        isPermanent: !credit.expires_at || credit.expires_at === '9999-12-31T23:59:59.999Z',
        isSubscription: credit.expires_at && credit.expires_at !== '9999-12-31T23:59:59.999Z'
      }
    })

    return NextResponse.json({
      history,
      success: true
    })

  } catch (error) {
    console.error('Credits history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}