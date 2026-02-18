import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { CreditCard, Download, Calendar, CheckCircle, XCircle, FileText, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

interface Payment {
    id: string
    plan: string
    amount: number
    currency: string
    status: string
    date: string
    created_at: string
    billing_period: string
    payment_method?: string
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
    amount?: number
}

export default function BillingSection() {
    const { user } = useAuth()
    const [payments, setPayments] = useState<Payment[]>([])
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)

    useEffect(() => {
        if (!user?.id) return

        const fetchData = async () => {
            try {
                // Fetch invoices (payments) and subscription in parallel
                const [invoicesRes, subRes] = await Promise.all([
                    fetch('/api/user/invoices', { credentials: 'include' }),
                    fetch('/api/user/subscription', { credentials: 'include' })
                ])

                if (invoicesRes.ok) {
                    const data = await invoicesRes.json()
                    setPayments(data.invoices || [])
                }

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
        setCancelling(true)
        try {
            const res = await fetch('/api/user/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(data.message || 'Subscription cancelled successfully')
                setShowCancelConfirm(false)
                // Refresh subscription data
                const subRes = await fetch('/api/user/subscription', { credentials: 'include' })
                if (subRes.ok) {
                    const subData = await subRes.json()
                    setSubscription(subData.subscription)
                }
            } else {
                console.error('Cancellation failed:', data)
                toast.error(data.error || 'Failed to cancel subscription')
            }
        } catch (error) {
            console.error('Cancellation error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setCancelling(false)
        }
    }

    const handleDownloadInvoice = async (paymentId: string) => {
        try {
            const res = await fetch(`/api/billing/invoice/${paymentId}/download`, {
                credentials: 'include'
            })

            if (res.ok) {
                const contentType = res.headers.get('content-type')
                if (contentType?.includes('application/pdf')) {
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `invoice-${paymentId}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                } else {
                    // Fallback: try to get JSON with URL
                    const data = await res.json()
                    if (data.url) {
                        window.open(data.url, '_blank')
                    } else {
                        toast.error('Invoice download not available for this payment')
                    }
                }
            } else {
                toast.error('Failed to download invoice')
            }
        } catch (error) {
            console.error('Invoice download error:', error)
            toast.error('Failed to download invoice')
        }
    }

    const formatAmount = (amount: number, currency: string) => {
        // Amounts from Dodo are in smallest unit (cents)
        const displayAmount = amount >= 100 ? amount / 100 : amount
        return displayAmount.toLocaleString('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        })
    }

    const subscriptionStatus = subscription?.status
    const isActiveLike = !!subscriptionStatus && ['active', 'trialing', 'pending'].includes(subscriptionStatus)
    const isPendingCancellation = subscriptionStatus === 'pending_cancellation'
    const canCancel = isActiveLike && !isPendingCancellation

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
                        <h2 className="text-2xl font-bold text-white">Subscription</h2>
                    </div>
                    {subscriptionStatus === 'active' && (
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Active
                        </div>
                    )}
                    {subscriptionStatus === 'trialing' && (
                        <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm font-medium rounded-full flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Trialing
                        </div>
                    )}
                    {subscriptionStatus === 'pending' && (
                        <div className="px-3 py-1 bg-white/10 text-white/80 text-sm font-medium rounded-full flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Pending
                        </div>
                    )}
                    {isPendingCancellation && (
                        <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Cancels at period end
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <div className="text-sm text-white/60 mb-1">
                                    {isPendingCancellation ? 'Expires On' : 'Next Billing'}
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {subscription.next_billing_date
                                        ? new Date(subscription.next_billing_date).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '-'}
                                </div>
                            </div>
                        </div>

                        {/* Cancellation notice */}
                        {isPendingCancellation && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-yellow-200 font-medium">Subscription ending</p>
                                        <p className="text-yellow-200/70 text-sm mt-1">
                                            Your subscription has been cancelled and will not renew. You can continue using your credits and features until{' '}
                                            {subscription.next_billing_date
                                                ? new Date(subscription.next_billing_date).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : 'the end of your billing period'}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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
                            {canCancel && (
                                <>
                                    <Link href="/plans">
                                        <button className="px-6 py-3 bg-[#FFFF00] hover:bg-[#baba00] text-black font-bold rounded-lg transition-colors">
                                            Upgrade Plan
                                        </button>
                                    </Link>
                                    {!showCancelConfirm ? (
                                        <button
                                            onClick={() => setShowCancelConfirm(true)}
                                            className="px-6 py-3 bg-white/5 hover:bg-red-500/10 text-white hover:text-red-400 font-bold rounded-lg border border-white/10 transition-colors flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Cancel Subscription
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                            <span className="text-red-300 text-sm">
                                                Are you sure? You&apos;ll keep access until the end of your billing period.
                                            </span>
                                            <button
                                                onClick={handleCancelSubscription}
                                                disabled={cancelling}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                Yes, Cancel
                                            </button>
                                            <button
                                                onClick={() => setShowCancelConfirm(false)}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Keep Plan
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                            {(isPendingCancellation || subscription.status === 'cancelled') && (
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
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[#FFFF00]" />
                        <h2 className="text-2xl font-bold text-white">Payment History</h2>
                    </div>
                    <span className="text-white/40 text-sm">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-16 text-white/60">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-white/20" />
                        <p>No payments found</p>
                        <p className="text-sm text-white/40 mt-2">Your payment history will appear here after your first purchase.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Plan</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">Amount</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-white/60">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-white/60">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.map((payment, index) => {
                                    const normalizedStatus = (payment.status || '').toLowerCase()
                                    const isPaid = normalizedStatus === 'succeeded' || normalizedStatus === 'paid'
                                    const isProcessing = normalizedStatus === 'processing' || normalizedStatus === 'pending'
                                    const canDownloadInvoice =
                                        normalizedStatus !== 'failed' &&
                                        normalizedStatus !== 'cancelled' &&
                                        normalizedStatus !== 'canceled'

                                    return (
                                        <motion.tr
                                            key={payment.id + '-' + index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-white/80">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-white/40" />
                                                    {new Date(payment.date || payment.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white/80 capitalize">
                                                {payment.plan || '-'}
                                                {payment.billing_period && (
                                                    <span className="text-white/40 ml-1">({payment.billing_period})</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-white">
                                                {formatAmount(payment.amount, payment.currency)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isPaid
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : isProcessing
                                                            ? 'bg-yellow-500/10 text-yellow-300'
                                                            : 'bg-red-500/10 text-red-400'
                                                        }`}
                                                >
                                                    {isPaid ? (
                                                        <CheckCircle className="w-3 h-3" />
                                                    ) : isProcessing ? (
                                                        <Clock className="w-3 h-3" />
                                                    ) : (
                                                        <AlertTriangle className="w-3 h-3" />
                                                    )}
                                                    {isPaid ? 'Paid' : isProcessing ? 'Processing' : (payment.status || 'Failed')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {canDownloadInvoice ? (
                                                    <button
                                                        onClick={() => {
                                                            if (payment.invoice_url) {
                                                                window.open(payment.invoice_url, '_blank')
                                                            } else {
                                                                handleDownloadInvoice(payment.id)
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-2 px-3 py-1 text-sm text-[#FFFF00] hover:text-[#c9c900] transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </button>
                                                ) : (
                                                    <span className="text-white/20 text-sm">-</span>
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
