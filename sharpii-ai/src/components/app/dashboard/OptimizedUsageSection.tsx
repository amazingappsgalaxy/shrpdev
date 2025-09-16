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

  const DEFAULT_TRANSACTION_LIMIT = 10

  const loadRecentActivity = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)

      // Only load recent tasks for activity - much faster than full credit analysis
      const tasksResponse = await fetch('/api/tasks/list?limit=50')
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        const tasks = tasksData.tasks || []

        // Convert tasks to transaction format for display
        const recentTransactions: Transaction[] = tasks
          .filter((task: any) => task.creditsConsumed && task.creditsConsumed > 0)
          .map((task: any) => ({
            id: task.id,
            type: 'debit' as const,
            amount: task.creditsConsumed,
            description: `${task.modelName || 'Image Enhancement'}`,
            timestamp: new Date(task.createdAt).getTime(),
            balanceAfter: 0 // We don't calculate running balance for performance
          }))
          .sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp)

        setTransactions(recentTransactions)
      }
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
                Your image enhancements will appear here
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
                    <div className="text-red-400 text-sm font-medium">
                      -{transaction.amount}
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