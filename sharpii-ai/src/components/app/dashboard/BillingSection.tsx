import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { CreditCard, Download, Calendar, CheckCircle, XCircle, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

interface Payment {
    id: string
    plan: string
    amount: number
    currency: string
    status: string
    paid_at: string
    created_at: string
    billing_period: string
    invoice_url?: string
}

interface Subscription {
    id: string
    plan: string
    status: string
    billing_period: string
    next_billing_date: string
    billing_name?: string
    billing_email?: string
    billing_address?: any
    currency?: string
}

export default function BillingSection() {
    const { user } = useAuth()
    const [payments, setPayments] = useState<Payment[]>([])
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        if (!user?.id) return

        const fetchData = async () => {
            try {
                // Fetch invoices (payments)
                const invoicesRes = await fetch('/api/user/invoices', {
                    credentials: 'include'
                })
                if (invoicesRes.ok) {
                    const data = await invoicesRes.json()
                    setPayments(data.invoices || [])
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

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
            return
        }

        setCancelling(true)
        try {
            const res = await fetch('/api/user/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()

            if (res.ok) {
                toast.success('Subscription cancelled successfully')
                // Refresh subscription data
                const subRes = await fetch('/api/user/subscription')
                if (subRes.ok) {
                    const subData = await subRes.json()
                    setSubscription(subData.subscription)
                }
            } else {
                toast.error(data.error || 'Failed to cancel subscription')
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.')
        } finally {
            setCancelling(false)
        }
    }

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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#FFFF00]/10 rounded-xl">
                            <CreditCard className="w-6 h-6 text-[#FFFF00]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Active Subscription</h2>
                    </div>
                    {subscription?.status === 'active' && (
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Active
                        </div>
                    )}
                    {subscription?.status === 'cancelled' && (
                        <div className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Cancelled
                        </div>
                    )}
                </div>

                {subscription ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <div className="text-sm text-white/60 mb-1">Plan</div>
                                <div className="text-xl font-bold text-white capitalize">
                                    {subscription.plan.includes('day') ? 'Day Pass' : subscription.plan}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-white/60 mb-1">Billing Period</div>
                                <div className="text-xl font-bold text-white capitalize">
                                    {subscription.billing_period}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-white/60 mb-1">Next Billing</div>
                                <div className="text-xl font-bold text-white">
                                    {subscription.status === 'cancelled' ? 'Expires on ' : ''}
                                    {subscription.next_billing_date
                                        ? new Date(subscription.next_billing_date).toLocaleDateString()
                                        : '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-white/60 mb-1">Amount</div>
                                <div className="text-xl font-bold text-white">
                                    {/* If plan amount is available locally or we can infer it. 
                                       For now, simplistic inference or placeholder as subscription object might not include amount directly 
                                       unless we joined with plans table or stored it. 
                                       Let's skip amount here if not readily available to avoid incorrect data.
                                   */}
                                    --
                                </div>
                            </div>
                        </div>

                        {/* Billing Details */}
                        {(subscription.billing_name || subscription.billing_email) && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">Billing Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-white/50 mb-1">Billed To</div>
                                        <div className="text-white font-medium">{subscription.billing_name}</div>
                                        <div className="text-white/70 text-sm">{subscription.billing_email}</div>
                                    </div>
                                    {subscription.billing_address && (
                                        <div>
                                            <div className="text-xs text-white/50 mb-1">Address</div>
                                            <div className="text-white/70 text-sm">
                                                {subscription.billing_address.line1}<br />
                                                {subscription.billing_address.city}, {subscription.billing_address.state} {subscription.billing_address.postal_code}<br />
                                                {subscription.billing_address.country}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10 mt-6">
                            {subscription.status === 'active' && (
                                <>
                                    <Link href="/plans">
                                        <button className="px-6 py-3 bg-[#FFFF00] hover:bg-[#baba00] text-black font-bold rounded-lg transition-colors">
                                            Upgrade Plan
                                        </button>
                                    </Link>
                                    <button
                                        onClick={handleCancelSubscription}
                                        disabled={cancelling}
                                        className="px-6 py-3 bg-white/5 hover:bg-red-500/10 text-white hover:text-red-400 font-bold rounded-lg border border-white/10 transition-colors flex items-center gap-2"
                                    >
                                        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Cancel Subscription
                                    </button>
                                </>
                            )}
                            {subscription.status === 'cancelled' && (
                                <Link href="/plans">
                                    <button className="px-6 py-3 bg-[#FFFF00] hover:bg-[#baba00] text-black font-bold rounded-lg transition-colors">
                                        Reactivate Subscription
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-white/60 mb-4">No active subscription</div>
                        <Link href="/plans">
                            <button className="px-6 py-3 bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-lg transition-colors">
                                View Plans
                            </button>
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Payment History & Invoices */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
            >
                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Invoices & Payment History</h2>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-16 text-white/60">
                        No invoices found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Amount</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white/60">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Invoice</th>
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
                                                    {new Date(payment.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-white">
                                                {/* Simple currency formatting */}
                                                {(payment.amount / 100).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: payment.currency || 'USD'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isPaid
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {isPaid ? (
                                                        <CheckCircle className="w-3 h-3" />
                                                    ) : (
                                                        <AlertTriangle className="w-3 h-3" />
                                                    )}
                                                    {isPaid ? 'Paid' : 'Failed'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isPaid && payment.invoice_url ? (
                                                    <a
                                                        href={payment.invoice_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1 text-sm text-[#FFFF00] hover:text-[#c9c900] transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </a>
                                                ) : (
                                                    <span className="text-white/20 text-sm">Unavailable</span>
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
