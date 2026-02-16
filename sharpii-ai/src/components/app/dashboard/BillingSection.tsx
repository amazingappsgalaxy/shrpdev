'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { CreditCard, Download, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Payment {
    id: string
    plan: string
    amount: number
    currency: string
    status: string
    paid_at: string
    created_at: string
    billing_period: string
}

export default function BillingSection() {
    const { user } = useAuth()
    const [payments, setPayments] = useState<Payment[]>([])
    const [subscription, setSubscription] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.id) return

        const fetchData = async () => {
            try {
                // Fetch payments
                const paymentsRes = await fetch('/api/user/payments', {
                    credentials: 'include'
                })
                if (paymentsRes.ok) {
                    const data = await paymentsRes.json()
                    setPayments(data.payments || [])
                }

                // Fetch subscription
                const subRes = await fetch('/api/user/subscription', {
                    credentials: 'include'
                })
                if (subRes.ok) {
                    const data = await subRes.json()
                    setSubscription(data.subscription)
                }
            } catch (error) {
                console.error('Error fetching billing data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user?.id])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Current Subscription */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#FFFF00]/10 rounded-xl">
                        <CreditCard className="w-6 h-6 text-[#FFFF00]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Active Subscription</h2>
                </div>

                {subscription ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm text-white/60 mb-1">Plan</div>
                                <div className="text-xl font-bold text-white capitalize">
                                    {subscription.plan}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-white/60 mb-1">Billing</div>
                                <div className="text-xl font-bold text-white capitalize">
                                    {subscription.billing_period}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-white/60 mb-1">Next Billing</div>
                                <div className="text-xl font-bold text-white">
                                    {subscription.next_billing_date
                                        ? new Date(subscription.next_billing_date).toLocaleDateString()
                                        : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button className="px-6 py-3 bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-lg transition-colors">
                                Upgrade Plan
                            </button>
                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 transition-colors">
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-white/60 mb-4">No active subscription</div>
                        <button className="px-6 py-3 bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-lg transition-colors">
                            View Plans
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Payment History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
            >
                <div className="p-8 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Payment History</h2>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-16 text-white/60">
                        No payment history yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Plan</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Amount</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white/60">Status</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white/60">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.map((payment, index) => {
                                    const isPaid = payment.status === 'succeeded' || payment.status === 'paid'

                                    return (
                                        <motion.tr
                                            key={payment.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-white/80">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-white/40" />
                                                    {new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white/80 capitalize">
                                                {payment.plan}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-white">
                                                {payment.currency === 'INR' ? '₹' : '$'}
                                                {(payment.amount / 100).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isPaid
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {isPaid ? (
                                                        <CheckCircle className="w-3 h-3" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3" />
                                                    )}
                                                    {isPaid ? 'Paid' : 'Failed'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isPaid && (
                                                    <button className="inline-flex items-center gap-2 px-3 py-1 text-sm text-[#FFFF00] hover:text-[#c9c900] transition-colors">
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
