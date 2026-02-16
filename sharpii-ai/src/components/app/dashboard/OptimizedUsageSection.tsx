'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { formatDistanceToNow } from 'date-fns'

// Safe date formatter with caching
const dateFormatCache = new Map<number, string>()
const safeFormatDistance = (date: Date | number) => {
  try {
    if (!date) return 'Unknown time'

    const timestamp = typeof date === 'number' ? date : date.getTime()
    if (isNaN(timestamp)) return 'Unknown time'

    if (dateFormatCache.has(timestamp)) {
      return dateFormatCache.get(timestamp)!
    }

    const dateObj = new Date(timestamp)
    const formatted = formatDistanceToNow(dateObj, { addSuffix: true })

    if (dateFormatCache.size > 100) {
      const firstKey = dateFormatCache.keys().next().value
      if (firstKey !== undefined) {
        dateFormatCache.delete(firstKey)
      }
    }
    dateFormatCache.set(timestamp, formatted)

    return formatted
  } catch (error) {
    console.warn('Date formatting error:', error)
    return 'Unknown time'
  }
}

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  timestamp: number
  balanceAfter: number
}

interface OptimizedUsageSectionProps {
  className?: string
}

export default function OptimizedUsageSection({ className }: OptimizedUsageSectionProps) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [creditBalance, setCreditBalance] = useState<any>(null)

  const DEFAULT_TRANSACTION_LIMIT = 10

  const loadRecentActivity = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)

      // Load credit balance and history
      let creditsResponse, historyResponse

      try {
        creditsResponse = await fetch('/api/credits/balance', {
          method: 'GET',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to fetch credits balance:', error)
      }

      try {
        historyResponse = await fetch('/api/credits/history?limit=20', {
          method: 'GET',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to fetch credits history:', error)
      }

      let recentTransactions: Transaction[] = []

      let historyData = null
      if (historyResponse && historyResponse.ok) {
        historyData = await historyResponse.json()
      }

      // Process history data
      if (historyData) {
        const history = historyData.history || []

        recentTransactions = history.map((item: any) => ({
          id: item.id,
          type: item.type,
          amount: item.amount,
          description: item.description || item.reason,
          timestamp: new Date(item.created_at).getTime(),
          balanceAfter: item.balance_after || 0
        }))
      }

      // Process credits data
      if (creditsResponse && creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        setCreditBalance(creditsData)

        // Add credit purchase transactions to show subscription credits with expiration
        if (creditsData.breakdown?.expiring) {
          creditsData.breakdown.expiring.forEach((expiring: any, index: number) => {
            recentTransactions.push({
              id: `subscription_credits_${index}`,
              type: 'credit' as const,
              amount: expiring.amount,
              description: `Subscription Credits (Expires ${new Date(expiring.expires_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })})`,
              timestamp: new Date(expiring.expires_at).getTime() - (30 * 24 * 60 * 60 * 1000), // 30 days before expiration
              balanceAfter: 0
            })
          })
        }

        // If no task transactions but we have credit data, create sample usage entries
        if (recentTransactions.filter(t => t.type === 'debit').length === 0 && creditsData.totalCredits > 0) {
          const usedCredits = creditsData.totalCredits - (creditsData.remaining || creditsData.totalCredits)
          if (usedCredits > 0) {
            recentTransactions.push({
              id: 'usage_summary',
              type: 'debit' as const,
              amount: usedCredits,
              description: 'Total Credits Used',
              timestamp: Date.now() - 86400000, // 1 day ago
              balanceAfter: creditsData.remaining || creditsData.totalCredits
            })
          }
        }
      } else if (creditsResponse) {
        console.error('Failed to fetch credit balance:', creditsResponse.status)
      }

      // Process credit history data (additions and deductions)
      // Since we already parsed historyData, reuse it
      if (historyData) {
        if (historyData.history) {
          const creditTransactions = historyData.history.map((h: any) => ({
            id: h.id,
            type: h.type,
            amount: h.amount,
            description: h.displayName || h.description || 'Credit transaction',
            timestamp: h.createdAt,
            balanceAfter: 0
          }))

          // Add credit history to transactions (but avoid duplicating task-based deductions)
          recentTransactions = [
            ...recentTransactions,
            ...creditTransactions.filter((ct: Transaction) =>
              ct.type === 'credit' || // Always include credit additions
              !recentTransactions.some(rt =>
                Math.abs(rt.timestamp - ct.timestamp) < 60000 && rt.amount === ct.amount
              ) // Avoid duplicate deductions
            )
          ]
        }
      } else if (historyResponse) {
        console.error('Failed to fetch credit history:', historyResponse.status)
      }

      // Sort all transactions by timestamp (most recent first)
      recentTransactions.sort((a, b) => b.timestamp - a.timestamp)

      setTransactions(recentTransactions)
    } catch (error) {
      console.error('Error loading recent activity:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadRecentActivity()
  }, [user?.id, loadRecentActivity])

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-white/5 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const displayedTransactions = showAll ? transactions : transactions.slice(0, DEFAULT_TRANSACTION_LIMIT)

  return (
    <div className={`${className}`}>
      <div className="space-y-6">
        {/* Credit Usage Summary */}
        {creditBalance && (
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-white/90 text-lg font-light mb-4">Credit Usage Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {(creditBalance.totalCredits - (creditBalance.remaining || creditBalance.totalCredits)).toLocaleString()}
                </div>
                <div className="text-white/60 text-sm">Credits Used</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#FFFF00]">
                  {(creditBalance.remaining || creditBalance.totalCredits).toLocaleString()}
                </div>
                <div className="text-white/60 text-sm">Credits Remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <h3 className="text-white/90 text-lg font-light mb-6">Recent Activity</h3>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-white/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-white/20 rounded"></div>
              </div>
              <p className="text-white/60">No recent activity</p>
              <p className="text-white/40 text-sm mt-2">
                {creditBalance && (creditBalance.totalCredits - (creditBalance.remaining || creditBalance.totalCredits)) > 0
                  ? 'Your credit usage will appear here as you enhance images'
                  : 'Your image enhancements will appear here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-white/90 text-sm font-medium truncate">
                        {transaction.description}
                      </div>
                      <div className="text-white/40 text-xs">
                        {safeFormatDistance(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-sm font-medium ${transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                    </div>
                    <div className="text-white/40 text-xs">
                      credits
                    </div>
                  </div>
                </div>
              ))}

              {/* View All Button */}
              {transactions.length > DEFAULT_TRANSACTION_LIMIT && (
                <div className="pt-4">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2 px-4 text-white/60 hover:text-white text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {showAll ? 'Show Less' : `View All (${transactions.length} activities)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}