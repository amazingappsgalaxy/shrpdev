'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { Coins, Crown, Calendar, Lock, Zap, ArrowRight, RefreshCw, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const openPlansPopup = () => window.dispatchEvent(new CustomEvent('sharpii:open-plans'))

export default function CreditsSection() {
    const { user } = useAuth()
    const [credits, setCredits] = useState({
        total: 0,
        subscription_credits: 0,
        permanent_credits: 0,
        subscription_expire_at: null as Date | null
    })
    const [subscription, setSubscription] = useState({
        has_active_subscription: false,
        current_plan: 'free',
        subscription: null as any
    })
    const [loading, setLoading] = useState(true)
    const [activating, setActivating] = useState(false)
    const [activatingSlowMode, setActivatingSlowMode] = useState(false)
    const [loadingTopup, setLoadingTopup] = useState<number | null>(null)
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pollAttemptsRef = useRef(0)
    const MAX_POLL_ATTEMPTS = 12 // fast phase: 12 × 5s = 60s

    const fetchCredits = async () => {
        const res = await fetch('/api/credits/balance', { credentials: 'include' })
        if (!res.ok) return null
        const data = await res.json()
        return data.balance
    }

    const fetchSubscription = async () => {
        const res = await fetch('/api/user/subscription', { credentials: 'include' })
        if (!res.ok) return null
        const data = await res.json()
        return data
    }

    const stopPolling = () => {
        if (pollRef.current) clearTimeout(pollRef.current)
        pollRef.current = null
        setActivating(false)
        setActivatingSlowMode(false)
    }

    const handleCreditsFound = async (balance: { total: number; subscription_credits: number; permanent_credits: number; subscription_expire_at: Date | null }) => {
        setCredits(balance)
        window.dispatchEvent(new CustomEvent('sharpii:credits-updated', { detail: balance }))
        const subData = await fetchSubscription()
        if (subData) {
            setSubscription({
                has_active_subscription: subData.has_active_subscription,
                current_plan: subData.current_plan,
                subscription: subData.subscription
            })
        }
        stopPolling()
    }

    const scheduleSlowPoll = () => {
        // Slow phase: poll every 30s indefinitely until credits appear or page unmounts
        pollRef.current = setTimeout(async () => {
            const balance = await fetchCredits()
            if (balance && balance.total > 0) {
                await handleCreditsFound(balance)
            } else {
                scheduleSlowPoll()
            }
        }, 30000)
    }

    const schedulePoll = () => {
        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
            // Fast phase exhausted — switch to slow background polling
            setActivating(false)
            setActivatingSlowMode(true)
            scheduleSlowPoll()
            return
        }
        pollRef.current = setTimeout(async () => {
            pollAttemptsRef.current += 1
            const balance = await fetchCredits()
            if (balance && balance.total > 0) {
                await handleCreditsFound(balance)
            } else {
                schedulePoll()
            }
        }, 5000)
    }

    const handleTopup = async (creditAmount: number) => {
        setLoadingTopup(creditAmount)
        try {
            const res = await fetch('/api/payments/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ credits: creditAmount })
            })
            const data = await res.json()
            if (res.ok && data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            } else {
                toast.error(data.error || data.message || 'Failed to start checkout')
            }
        } catch {
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoadingTopup(null)
        }
    }

    useEffect(() => {
        if (!user?.id) return

        const fetchData = async () => {
            try {
                const [balance, subData] = await Promise.all([fetchCredits(), fetchSubscription()])
                if (balance) setCredits(balance)
                if (subData) {
                    setSubscription({
                        has_active_subscription: subData.has_active_subscription,
                        current_plan: subData.current_plan,
                        subscription: subData.subscription
                    })
                    // If there's a pending subscription with 0 credits, the webhook hasn't fired yet.
                    // Start polling until credits appear (webhook processes the payment).
                    const subStatus = subData.subscription?.status
                    if (balance?.total === 0 && subStatus === 'pending') {
                        setActivating(true)
                        pollAttemptsRef.current = 0
                        schedulePoll()
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-40 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-16 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-20 bg-white/5 rounded-lg animate-pulse" />
            </div>
        )
    }

    const planLabel = subscription.current_plan.charAt(0).toUpperCase() + subscription.current_plan.slice(1)
    const subData = subscription.subscription
    const isPendingCancel = subData?.status === 'pending_cancellation'

    const subPct = credits.total > 0 ? Math.round((credits.subscription_credits / credits.total) * 100) : 0
    const permPct = credits.total > 0 ? Math.round((credits.permanent_credits / credits.total) * 100) : 0

    return (
        <div className="space-y-3">
            {/* Main credits block */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Available Credits</p>
                        <span className="text-5xl font-black text-white tabular-nums leading-none">
                            {credits.total.toLocaleString()}
                        </span>
                    </div>
                    {subscription.has_active_subscription ? (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span className="text-sm font-semibold text-white/70 capitalize">{planLabel}</span>
                        </div>
                    ) : (
                        <button
                            onClick={openPlansPopup}
                            className="flex items-center gap-1.5 bg-[#FFFF00] text-black text-xs font-bold px-3 py-1.5 rounded-md transition-colors hover:bg-[#c9c900] mt-1"
                        >
                            <Zap className="w-3 h-3" />
                            Get Plan
                        </button>
                    )}
                </div>

                {/* Credit type breakdown — shown only when credits exist */}
                {credits.total > 0 && (
                    <div className="mt-6 space-y-3">
                        {credits.subscription_credits > 0 && (
                            <div>
                                <div className="flex justify-between text-xs text-white/50 mb-1.5">
                                    <span>Subscription</span>
                                    <span className="tabular-nums font-medium text-white/70">{credits.subscription_credits.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#FFFF00] rounded-full" style={{ width: `${subPct}%` }} />
                                </div>
                                {credits.subscription_expire_at && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-white/30">
                                        <Calendar className="w-2.5 h-2.5" />
                                        Expires {new Date(credits.subscription_expire_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                )}
                            </div>
                        )}
                        {credits.permanent_credits > 0 && (
                            <div>
                                <div className="flex justify-between text-xs text-white/50 mb-1.5">
                                    <span>Permanent</span>
                                    <span className="tabular-nums font-medium text-white/70">{credits.permanent_credits.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${permPct}%` }} />
                                </div>
                                <div className="text-xs text-white/30 mt-1">Never expires</div>
                            </div>
                        )}
                    </div>
                )}

                {credits.total === 0 && activating && (
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                        <p className="text-sm text-white/40">Activating your credits…</p>
                    </div>
                )}
                {credits.total === 0 && activatingSlowMode && (
                    <div className="mt-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                            <p className="text-sm text-amber-400/80">Payment received — credits are being processed.</p>
                        </div>
                        <p className="text-xs text-white/30 pl-5">This can take a few minutes. This page will update automatically.</p>
                    </div>
                )}
                {credits.total === 0 && !activating && !activatingSlowMode && (
                    <p className="mt-4 text-sm text-white/30">No credits yet. Subscribe to a plan to get started.</p>
                )}
            </motion.div>

            {/* Plan status row */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-[#FFFF00]" />
                    <div>
                        <p className="text-sm font-semibold text-white">
                            {subscription.has_active_subscription ? `${planLabel} Plan` : 'Free Tier'}
                        </p>
                        {subData?.next_billing_date && (
                            <p className="text-xs text-white/40 mt-0.5">
                                {isPendingCancel ? 'Expires' : 'Renews'}{' '}
                                {new Date(subData.next_billing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        )}
                        {!subscription.has_active_subscription && (
                            <p className="text-xs text-white/40 mt-0.5">Subscribe to unlock premium features</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={openPlansPopup}
                    className="flex items-center gap-1.5 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
                >
                    {subscription.has_active_subscription ? 'Upgrade' : 'View Plans'}
                    <ArrowRight className="w-3 h-3" />
                </button>
            </motion.div>

            {/* One-time top-up */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">One-Time Top-Up</span>
                </div>

                {subscription.has_active_subscription ? (
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { credits: 500, price: 5 },
                            { credits: 1000, price: 9 },
                            { credits: 2500, price: 20 },
                            { credits: 5000, price: 35 }
                        ].map((pkg) => (
                            <button
                                key={pkg.credits}
                                onClick={() => handleTopup(pkg.credits)}
                                disabled={loadingTopup !== null}
                                className="flex flex-col items-center py-3 border border-white/10 hover:border-[#FFFF00]/50 hover:bg-[#FFFF00]/5 rounded-md transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loadingTopup === pkg.credits ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-[#FFFF00] mb-1" />
                                ) : (
                                    <span className="text-sm font-bold text-white group-hover:text-[#FFFF00] transition-colors">{pkg.credits.toLocaleString()}</span>
                                )}
                                <span className="text-xs text-white/35 mt-0.5">credits</span>
                                <span className="text-xs font-bold text-[#FFFF00] mt-1.5">${pkg.price}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-white/25 flex-shrink-0" />
                        <span className="text-xs text-white/40 flex-1">Requires an active subscription</span>
                        <button
                            onClick={openPlansPopup}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
                        >
                            View Plans
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
