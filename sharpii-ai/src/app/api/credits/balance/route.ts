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
        console.log('Simple auth userId:', userId)
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
          console.log('Auth.api session userId:', userId)
        }
      } catch (e) {
        console.log('Auth.api getSession failed:', e.message)
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const now = new Date().toISOString()

    // Get active credits from credits table
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (creditsError) {
      console.error('Error fetching credits:', creditsError)
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
    }

    const activeCredits = credits || []

    // Separate credits into positive (additions) and negative (deductions)
    let subscriptionCreditsGross = 0
    let permanentCreditsGross = 0
    let totalDeductions = 0
    const expiringCredits: any[] = []

    // Process all credits (both additions and deductions)
    for (const credit of activeCredits) {
      const amount = credit.amount || 0
      const expiresAt = credit.expires_at
      const isExpired = expiresAt && new Date(expiresAt) <= new Date()

      if (isExpired) continue

      if (amount > 0) {
        // This is a credit addition
        if (expiresAt && expiresAt !== '9999-12-31T23:59:59.999Z') {
          // Subscription credit (has real expiry date)
          subscriptionCreditsGross += amount
          expiringCredits.push({
            amount,
            expires_at: expiresAt,
            source: credit.source,
            type: credit.type
          })
        } else {
          // Permanent credit (no expiry or max date)
          permanentCreditsGross += amount
        }
      } else if (amount < 0) {
        // This is a deduction
        totalDeductions += Math.abs(amount)
      }
    }

    // Calculate net credits (gross credits minus deductions)
    const totalGrossCredits = subscriptionCreditsGross + permanentCreditsGross
    const remainingCredits = Math.max(0, totalGrossCredits - totalDeductions)

    // Calculate remaining subscription and permanent credits proportionally
    // If we have deductions, we need to figure out how they affect each type
    let subscriptionCreditsNet = subscriptionCreditsGross
    let permanentCreditsNet = permanentCreditsGross

    if (totalDeductions > 0 && totalGrossCredits > 0) {
      // Deduct proportionally from subscription and permanent credits
      const subscriptionRatio = subscriptionCreditsGross / totalGrossCredits
      const permanentRatio = permanentCreditsGross / totalGrossCredits

      const subscriptionDeductions = totalDeductions * subscriptionRatio
      const permanentDeductions = totalDeductions * permanentRatio

      subscriptionCreditsNet = Math.max(0, subscriptionCreditsGross - subscriptionDeductions)
      permanentCreditsNet = Math.max(0, permanentCreditsGross - permanentDeductions)
    }

    return NextResponse.json({
      totalCredits: remainingCredits,
      remaining: remainingCredits,
      subscriptionCredits: Math.round(subscriptionCreditsNet),
      permanentCredits: Math.round(permanentCreditsNet),
      expiringCredits: Math.round(subscriptionCreditsNet),
      breakdown: {
        expiring: expiringCredits,
        permanent: Math.round(permanentCreditsNet)
      },
      success: true
    })

  } catch (error) {
    console.error('Credits balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}