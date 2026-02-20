'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { Coins, Crown, Calendar, Lock, Zap, ArrowRight, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

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

    useEffect(() => {
        if (!user?.id) return

        const fetchData = async () => {
            try {
                const [creditsRes, subRes] = await Promise.all([
                    fetch('/api/credits/balance', { credentials: 'include' }),
                    fetch('/api/user/subscription', { credentials: 'include' })
                ])
                if (creditsRes.ok) {
                    const data = await creditsRes.json()
                    setCredits(data.balance)
                }
                if (subRes.ok) {
                    const data = await subRes.json()
                    setSubscription({
                        has_active_subscription: data.has_active_subscription,
                        current_plan: data.current_plan,
                        subscription: data.subscription
                    })
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
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

                {credits.total === 0 && (
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
                                className="flex flex-col items-center py-3 border border-white/10 hover:border-[#FFFF00]/50 hover:bg-[#FFFF00]/5 rounded-md transition-all group"
                            >
                                <span className="text-sm font-bold text-white group-hover:text-[#FFFF00] transition-colors">{pkg.credits.toLocaleString()}</span>
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
