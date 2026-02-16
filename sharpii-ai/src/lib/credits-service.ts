import { supabase, supabaseAdmin } from './supabase'
import { PRICING_PLANS } from './pricing-config'
import { v4 as uuidv4 } from 'uuid'

export interface CreditBalance {
  total: number
  used: number
  remaining: number
  expires_at: Date | null
}

export interface CreditTransaction {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  description: string
  balance_before: number
  balance_after: number
  created_at: string
}

export class CreditsService {
  /**
   * Get user's current credit balance
   */
  static async getUserCredits(userId: string): Promise<CreditBalance> {
    // Use admin client for server-side, regular client for browser; fallback to supabase if admin not available
    const client = ((typeof window === 'undefined' ? supabaseAdmin : supabase) ?? supabase) as any

    // Get all active credits for the user
    const { data: credits, error: creditsError } = await client
      .from('credits')
      .select('amount, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    if (creditsError) {
      console.error('Error fetching user credits:', JSON.stringify(creditsError, null, 2))
      // DO NOT THROW, return 0 instead
      // throw new Error('Failed to fetch credits')
    }

    // Get total used credits from transactions
    let transactions: any[] = []
    try {
      const { data, error: transError } = await client
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'debit')

      if (transError) {
        console.error('Error fetching credit transactions:', JSON.stringify(transError, null, 2))
        // Default to empty transactions
        transactions = []
      } else {
        transactions = data || []
      }
    } catch (e) {
      console.error('Exception fetching credit transactions:', e)
      transactions = []
    }

    const totalCredits = (credits || [])?.reduce((sum: number, credit: { amount: number }) => sum + credit.amount, 0) || 0
    const usedCredits = Math.abs(transactions?.reduce((sum: number, trans: { amount: number }) => sum + trans.amount, 0) || 0)
    const remainingCredits = Math.max(0, totalCredits - usedCredits)

    // Find the earliest expiry date
    const expiryDates = credits?.map((c: { expires_at: string }) => new Date(c.expires_at)).filter(Boolean) || []
    const earliestExpiry = expiryDates.length > 0 ? new Date(Math.min(...expiryDates.map((d: Date) => d.getTime()))) : null

    return {
      total: totalCredits,
      used: usedCredits,
      remaining: remainingCredits,
      expires_at: earliestExpiry
    }
  }

  /**
   * Allocate credits to user after successful subscription payment
   */
  static async allocateSubscriptionCredits(
    userId: string,
    plan: string,
    billingPeriod: 'monthly' | 'yearly',
    subscriptionId: string,
    paymentId: string
  ): Promise<void> {
    // Get plan configuration
    const planConfig = PRICING_PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase())
    if (!planConfig) {
      throw new Error(`Plan configuration not found: ${plan}`)
    }

    const creditsToAllocate = planConfig.credits.monthly

    // Calculate expiry date (monthly or yearly from now)
    const expiryDate = new Date()
    if (billingPeriod === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    }

    // Get current balance for transaction tracking
    const currentBalance = await this.getUserCredits(userId)

    const admin = (supabaseAdmin ?? supabase) as any

    // Insert credit allocation (using admin client to bypass RLS when available)
    const { data: creditData, error: creditError } = await admin
      .from('credits')
      .insert({
        user_id: userId,
        amount: creditsToAllocate,
        type: 'subscription',
        source: 'payment',
        subscription_id: null, // Don't use Dodo subscription IDs here (store in metadata instead)
        transaction_id: paymentId,
        expires_at: expiryDate.toISOString(),
        is_active: true,
        metadata: {
          plan,
          billingPeriod,
          allocated_at: new Date().toISOString(),
          dodo_subscription_id: subscriptionId // Store the original Dodo ID in metadata
        }
      })
      .select()
      .single()

    if (creditError) {
      console.error('Error allocating credits:', creditError)
      throw new Error('Failed to allocate credits')
    }

    // Record the credit transaction (using admin client to bypass RLS when available)
    const { error: transError } = await admin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        credit_id: creditData.id,
        amount: creditsToAllocate,
        type: 'credit',
        reason: 'subscription_renewal',
        description: `Credits allocated for ${plan} plan (${billingPeriod})`,
        subscription_id: null, // Don't use Dodo subscription IDs here (store in metadata instead)
        balance_before: currentBalance.remaining,
        balance_after: currentBalance.remaining + creditsToAllocate,
        metadata: {
          plan,
          billingPeriod,
          payment_id: paymentId
        }
      })

    if (transError) {
      console.error('Error recording credit transaction:', transError)
      throw new Error('Failed to record credit transaction')
    }

    console.log(`✅ Allocated ${creditsToAllocate} credits to user ${userId} for ${plan} plan`)
  }

  /**
   * Deduct credits for image enhancement task
   */
  static async deductCredits(
    userId: string,
    amount: number,
    taskId: string,
    description: string
  ): Promise<boolean> {
    const currentBalance = await this.getUserCredits(userId)

    if (currentBalance.remaining < amount) {
      console.log(`❌ Insufficient credits: ${currentBalance.remaining} < ${amount}`)
      return false
    }

    const admin = (supabaseAdmin ?? supabase) as any

    // Record the debit transaction (using admin client to bypass RLS when available)
    const { error: transError } = await admin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount, // Negative for debit
        type: 'debit',
        reason: 'image_enhancement',
        description,
        enhancement_task_id: taskId,
        balance_before: currentBalance.remaining,
        balance_after: currentBalance.remaining - amount,
        metadata: {
          task_id: taskId,
          credits_deducted: amount
        }
      })

    if (transError) {
      console.error('Error deducting credits:', transError)
      throw new Error('Failed to deduct credits')
    }

    console.log(`✅ Deducted ${amount} credits from user ${userId} for task ${taskId}`)
    return true
  }

  /**
   * Get user's credit transaction history
   */
  static async getCreditHistory(userId: string, limit = 50): Promise<CreditTransaction[]> {
    // Use admin client for server-side, regular client for browser; fallback to supabase if admin not available
    const client = ((typeof window === 'undefined' ? supabaseAdmin : supabase) ?? supabase) as any

    const { data, error } = await client
      .from('credit_transactions')
      .select('id, amount, type, reason, description, balance_before, balance_after, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching credit history:', error)
      throw new Error('Failed to fetch credit history')
    }

    return data || []
  }

  /**
   * Expire old credits
   */
  static async expireOldCredits(): Promise<void> {
    const admin = (supabaseAdmin ?? supabase) as any

    const { error } = await admin
      .from('credits')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)

    if (error) {
      console.error('Error expiring old credits:', error)
      throw new Error('Failed to expire old credits')
    }

    console.log('✅ Expired old credits')
  }
}