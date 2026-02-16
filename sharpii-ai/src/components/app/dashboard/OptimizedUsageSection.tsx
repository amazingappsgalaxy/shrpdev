'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { Activity, TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface Transaction {
    id: string
    amount: number
    type: 'credit' | 'debit'
    reason: string
    description: string
    balance_before: number
    balance_after: number
    created_at: string
    metadata?: any
}

export default function OptimizedUsageSection() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.id) return

        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/credits/history?limit=50', {
                    credentials: 'include'
                })
                if (res.ok) {
                    const data = await res.json()
                    setTransactions(data.history || [])
                }
            } catch (error) {
                console.error('Error fetching credit history:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [user?.id])

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                ))}
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                <Activity className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Activity Yet</h3>
                <p className="text-white/60">
                    Your credit transactions will appear here
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#FFFF00]/10 rounded-xl">
                    <Activity className="w-6 h-6 text-[#FFFF00]" />
                </div>
                <h2 className="text-2xl font-bold text-white">Transaction History</h2>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Task ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Description</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Credits</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map((tx, index) => {
                                const isCredit = tx.type === 'credit'
                                const taskId = tx.metadata?.task_id || '-'

                                return (
                                    <motion.tr
                                        key={tx.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-white/80">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-white/40" />
                                                {new Date(tx.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-white/60">
                                            {taskId}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/80">
                                            {tx.description || tx.reason}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1 font-bold ${isCredit ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {isCredit ? (
                                                    <TrendingUp className="w-4 h-4" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4" />
                                                )}
                                                {isCredit ? '+' : ''}{tx.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-white">
                                            {tx.balance_after?.toLocaleString() || '-'}
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {transactions.length >= 50 && (
                <div className="text-center text-white/60 text-sm">
                    Showing last 50 transactions
                </div>
            )}
        </div>
    )
}
