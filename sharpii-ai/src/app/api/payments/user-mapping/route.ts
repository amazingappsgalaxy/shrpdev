import { NextRequest, NextResponse } from 'next/server'

// In-memory mapping as fallback (will be lost on server restart)
const subscriptionUserMapping = new Map<string, {
  userId: string,
  plan: string,
  billingPeriod: string,
  userEmail: string,
  paymentId?: string,
  timestamp: number
}>()

// Time-based pending checkouts (keyed by user ID + plan + billing period)
const pendingCheckouts = new Map<string, {
  userId: string,
  plan: string,
  billingPeriod: string,
  userEmail: string,
  userName: string,
  timestamp: number
}>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, subscriptionId, userId, plan, billingPeriod, userEmail, paymentId, userName } = body

    if (action === 'store') {
      // Store mapping with timestamp for cleanup
      const mapping = {
        userId,
        plan,
        billingPeriod,
        userEmail,
        paymentId,
        timestamp: Date.now()
      }

      // Store by subscription ID
      subscriptionUserMapping.set(subscriptionId, mapping)
      console.log(`📝 Stored mapping: ${subscriptionId} -> ${userId} (${userEmail})`)

      // Also store by payment ID if available
      if (paymentId) {
        subscriptionUserMapping.set(paymentId, mapping)
        console.log(`📝 Stored mapping by payment ID: ${paymentId} -> ${userId} (${userEmail})`)
      }

      // Store as pending checkout for time-based correlation
      const pendingKey = `${userId}:${plan}:${billingPeriod}`
      pendingCheckouts.set(pendingKey, {
        userId,
        plan,
        billingPeriod,
        userEmail,
        userName: userName || userEmail,
        timestamp: Date.now()
      })
      console.log(`⏰ Stored pending checkout: ${pendingKey}`)

      return NextResponse.json({ success: true, message: 'Mapping stored' })
    }

    if (action === 'get') {
      // Get mapping
      const mapping = subscriptionUserMapping.get(subscriptionId)
      if (mapping) {
        console.log(`📋 Retrieved mapping: ${subscriptionId} -> ${mapping.userId} (${mapping.userEmail})`)
        return NextResponse.json({ success: true, mapping })
      } else {
        return NextResponse.json({ success: false, error: 'Mapping not found' })
      }
    }

    if (action === 'findByPlan') {
      // Find recent pending checkout by plan (time-based correlation)
      const { plan: targetPlan, billingPeriod: targetBillingPeriod } = body
      const now = Date.now()
      const maxAge = 15 * 60 * 1000 // 15 minutes

      console.log(`⏰ Looking for recent checkout: plan=${targetPlan}, billing=${targetBillingPeriod}`)

      // Find the most recent pending checkout for this plan within time window
      let bestMatch: any = null
      let bestScore = 0

      for (const [key, pending] of pendingCheckouts.entries()) {
        const age = now - pending.timestamp
        if (age > maxAge) continue // Too old

        // Exact plan match gets higher score
        let score = 1
        if (pending.plan === targetPlan) score += 10
        if (pending.billingPeriod === targetBillingPeriod) score += 10

        // More recent gets higher score
        score += Math.max(0, (maxAge - age) / maxAge) * 5

        if (score > bestScore) {
          bestScore = score
          bestMatch = pending
        }
      }

      if (bestMatch) {
        console.log(`✅ Found time-correlated user: ${bestMatch.userId} (${bestMatch.userEmail}) for ${targetPlan}`)
        return NextResponse.json({
          success: true,
          mapping: bestMatch,
          correlationScore: bestScore
        })
      } else {
        console.log(`⚠️ No recent checkout found for plan: ${targetPlan}`)
        return NextResponse.json({ success: false, error: 'No recent checkout found' })
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' })

  } catch (error) {
    console.error('User mapping API error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subscriptionId = searchParams.get('subscriptionId')
  const paymentId = searchParams.get('paymentId')

  if (!subscriptionId && !paymentId) {
    return NextResponse.json({ success: false, error: 'subscriptionId or paymentId required' }, { status: 400 })
  }

  // Try subscription ID first, then payment ID
  const lookupId = subscriptionId || paymentId
  const mapping = subscriptionUserMapping.get(lookupId!)

  if (mapping) {
    console.log(`📋 Retrieved mapping via GET: ${lookupId} -> ${mapping.userId} (${mapping.userEmail})`)
    return NextResponse.json({ success: true, mapping })
  } else {
    console.log(`⚠️ Mapping not found for ${subscriptionId ? 'subscription' : 'payment'}: ${lookupId}`)
    return NextResponse.json({ success: false, error: 'Mapping not found' })
  }
}

// Cleanup old mappings (run this periodically)
setInterval(() => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  for (const [key, value] of subscriptionUserMapping.entries()) {
    if (now - value.timestamp > maxAge) {
      subscriptionUserMapping.delete(key)
      console.log(`🧹 Cleaned up old mapping: ${key}`)
    }
  }
}, 60 * 60 * 1000) // Run every hour