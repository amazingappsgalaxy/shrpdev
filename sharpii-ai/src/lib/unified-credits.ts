/**
 * Unified Credits Service
 * Single source of truth for all credit operations across the app
 */

import { CreditsService } from './credits-service'
import { CreditManager } from './credits'
import { isSupabaseConfigured } from './supabase'

export interface UnifiedCreditBalance {
  remaining: number
  total: number
  used: number
  expires_at: Date | null
  breakdown: {
    expiring: {
      amount: number
      expires_at: Date | null
    }[]
    permanent: number
  }
}

export interface UnifiedCreditTransaction {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  description: string
  createdAt: number
  metadata?: any
}

export class UnifiedCreditsService {
  /**
   * Get user's current credit balance - single source of truth
   */
  static async getUserCredits(userId: string): Promise<UnifiedCreditBalance> {
    try {
      if (isSupabaseConfigured) {
        // Try the new CreditsService first
        const balance = await CreditsService.getUserCredits(userId)
        return {
          remaining: balance.remaining,
          total: balance.total,
          used: balance.used,
          expires_at: balance.expires_at,
          breakdown: {
            expiring: [{
              amount: balance.remaining,
              expires_at: balance.expires_at
            }],
            permanent: 0
          }
        }
      } else {
        // Fallback to CreditManager
        const remaining = await CreditManager.getUserCreditBalance(userId)
        return {
          remaining,
          total: remaining,
          used: 0,
          expires_at: null,
          breakdown: {
            expiring: [],
            permanent: remaining
          }
        }
      }
    } catch (error) {
      console.error('Error in unified credit service:', error)

      // Don't fallback to mock data for new users

      // Return zero balance if everything fails
      return {
        remaining: 0,
        total: 0,
        used: 0,
        expires_at: null,
        breakdown: {
          expiring: [],
          permanent: 0
        }
      }
    }
  }

  /**
   * Get user's credit transaction history
   */
  static async getCreditHistory(userId: string, limit = 50): Promise<UnifiedCreditTransaction[]> {
    try {
      if (isSupabaseConfigured) {
        const history = await CreditsService.getCreditHistory(userId, limit)
        return history.map(tx => ({
          id: tx.id,
          amount: Math.abs(tx.amount),
          type: tx.type,
          reason: tx.reason,
          description: tx.description,
          createdAt: new Date(tx.created_at).getTime(),
          metadata: undefined
        }))
      } else {
        const history = await CreditManager.getCreditHistory(userId, limit)
        return history.map(tx => ({
          id: tx.id,
          amount: Math.abs(tx.amount),
          type: tx.type === 'deduction' ? 'debit' : 'credit',
          reason: tx.reason,
          description: tx.description,
          createdAt: new Date(tx.createdAt).getTime(),
          metadata: undefined
        }))
      }
    } catch (error) {
      console.error('Error getting unified credit history:', error)
      // Return empty history instead of mock data for new users
      return []
    }
  }

  /**
   * Deduct credits for a task
   */
  static async deductCredits(
    userId: string,
    amount: number,
    taskId: string,
    description: string
  ): Promise<boolean> {
    try {
      if (isSupabaseConfigured) {
        return await CreditsService.deductCredits(userId, amount, taskId, description)
      } else {
        const result = await CreditManager.deductCredits({
          userId,
          amount,
          reason: 'image_enhancement',
          description,
          enhancementTaskId: taskId
        })
        return result.success
      }
    } catch (error) {
      console.error('Error deducting credits:', error)
      return false
    }
  }

  /**
   * Check if user has sufficient credits
   */
  static async hasEnoughCredits(userId: string, requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getUserCredits(userId)
      return balance.remaining >= requiredAmount
    } catch (error) {
      console.error('Error checking credit sufficiency:', error)
      return false
    }
  }

  /**
   * Format credits for display
   */
  static formatCredits(credits: number): string {
    return credits.toLocaleString()
  }
}

// Export for backward compatibility
export { UnifiedCreditsService as CreditService }