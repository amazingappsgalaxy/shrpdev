'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  Clock,
  Zap,
  CreditCard,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react'
import { CreditManager, creditUtils } from '@/lib/credits'
import { CreditsService } from '@/lib/credits-service'
import { motion } from 'framer-motion'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-client-simple'

interface CreditTransaction {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  description: string
  createdAt: number
  balanceBefore?: number
  balanceAfter?: number
  enhancementTaskId?: string
}

interface CreditBalance {
  total: number
  active: number
  expiring: number
  expired: number
}

export function UsageDashboard() {
  const { user } = useAuth()
  const [creditBalance, setCreditBalance] = useState<CreditBalance>({ total: 0, active: 0, expiring: 0, expired: 0 })
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadUsageData()
    }
  }, [user?.id])

  // Periodically refresh usage data every 30 seconds to keep credits up-to-date
  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(() => {
      loadUsageData()
    }, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  const loadUsageData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        setError('User not authenticated')
        return
      }

      if (isSupabaseConfigured) {
        // Use the new CreditsService for more accurate data
        const creditBalance = await CreditsService.getUserCredits(user.id)
        const history = await CreditsService.getCreditHistory(user.id, 20)

        // Calculate expiring soon credits (within 7 days)
        const now = new Date()
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        // Get detailed credit information using legacy CreditManager for additional data
        let expiringSoon = 0
        try {
          const activeCredits = await CreditManager.getActiveCredits(user.id)
          expiringSoon = activeCredits
            .filter((credit: any) => {
              const expiration = new Date(credit.expires_at)
              return expiration <= sevenDaysFromNow && expiration > now
            })
            .reduce((sum: number, credit: any) => sum + (credit.amount || 0), 0)
        } catch (err) {
          console.warn('Could not fetch detailed credit info:', err)
        }

        setCreditBalance({
          total: creditBalance.total,
          active: creditBalance.remaining,
          expiring: expiringSoon,
          expired: 0
        })

        const typedHistory: CreditTransaction[] = (history || []).map((h: any) => ({
          id: h.id,
          amount: h.amount,
          type: (h.amount ?? 0) >= 0 ? 'credit' : 'debit',
          reason: h.reason || 'unknown',
          description: h.description,
          createdAt: new Date(h.created_at).getTime(),
          balanceBefore: h.balance_before,
          balanceAfter: h.balance_after,
          enhancementTaskId: h.enhancement_task_id
        }))
        setTransactions(typedHistory)
      } else {
        // Fallback path: call our API which handles auth and server-side data access
        const res = await fetch('/api/debug/credits', { credentials: 'include' })
        if (!res.ok) {
          throw new Error(`API error ${res.status}`)
        }
        const data = await res.json()

        const balance = data?.credits?.balance ?? 0
        const details = data?.credits?.creditDetails ?? []

        const now = Date.now()
        const msDay = 24 * 60 * 60 * 1000
        const expiringSoon = details
          .filter((c: any) => {
            const raw = c.expiresAt ?? c.expires_at
            if (!raw) return false
            const expiration = typeof raw === 'number' ? raw : new Date(raw).getTime()
            const daysUntilExpiration = Math.ceil((expiration - now) / msDay)
            return daysUntilExpiration <= 7 && daysUntilExpiration > 0
          })
          .reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

        setCreditBalance({ total: balance, active: balance, expiring: expiringSoon, expired: 0 })

        const history = Array.isArray(data?.recentHistory) ? data.recentHistory : []
        const typedHistory: CreditTransaction[] = history.map((h: any) => ({
          id: h.id,
          amount: h.amount,
          type: (h.amount ?? 0) >= 0 ? 'credit' : 'debit',
          reason: h.reason || h.source || 'unknown',
          description: h.description,
          createdAt: h.createdAt ?? (h.created_at ? new Date(h.created_at).getTime() : Date.now()),
          balanceBefore: h.balanceBefore,
          balanceAfter: h.balanceAfter,
          enhancementTaskId: h.enhancementTaskId || h.enhancement_task_id
        }))
        setTransactions(typedHistory)
      }
    } catch (err) {
      console.error('Error loading usage data:', err)
      setError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (transaction: CreditTransaction) => {
    if (transaction.type === 'credit') {
      return <ArrowUp className="h-4 w-4 text-green-500" />
    } else {
      return <ArrowDown className="h-4 w-4 text-red-500" />
    }
  }

  const getTransactionColor = (transaction: CreditTransaction) => {
    return transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">{error}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Credit Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Available Credits</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {creditUtils.formatCredits(creditBalance.active)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Earned</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {creditUtils.formatCredits(transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Used</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {creditUtils.formatCredits(Math.abs(transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {creditUtils.formatCredits(creditBalance.expiring)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Credit History
            </h3>
            <button
              onClick={loadUsageData}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions yet. Start using credits to see your history here.
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      {/* Show expiration info for credit transactions */}
                      {transaction.type === 'credit' && (
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <p className="text-xs text-blue-600">
                            {transaction.reason === 'subscription_renewal' ? (
                              `Subscription credits (monthly) • Expires: ${formatDate(transaction.createdAt + (30 * 24 * 60 * 60 * 1000))}`
                            ) : transaction.reason === 'credit_purchase' ? 'One-time purchase credits' :
                             transaction.reason === 'bonus' ? 'Bonus credits' : 'Credits allocated'}
                          </p>
                        </div>
                      )}
                      {/* Show task info for debit transactions */}
                      {transaction.type === 'debit' && transaction.enhancementTaskId && (
                        <div className="flex items-center gap-2 mt-1">
                          <Zap className="h-3 w-3 text-purple-500" />
                          <p className="text-xs text-purple-600">
                            Task: {transaction.enhancementTaskId.slice(-8)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction)}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    {transaction.balanceAfter != null && (
                      <p className="text-sm text-gray-500">
                        Balance: {transaction.balanceAfter.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}