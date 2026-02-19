'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { Coins, Crown, TrendingUp, Calendar, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function CreditsSection() {
    const { user } = useAuth()
    const router = useRouter()
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
                <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
            </div>
        )
    }

    const topUpPackages = [
        { credits: 500, price: 5 },
        { credits: 1000, price: 9 },
        { credits: 2500, price: 20 },
        { credits: 5000, price: 35 }
    ]

    return (
        <div className="space-y-3">
            {/* Credits Overview — single compact row */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Coins className="w-4 h-4 text-[#FFFF00]" />
                    <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Credits</span>
                </div>
                <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-bold text-white tabular-nums">
                        {credits.total.toLocaleString()}
                    </span>
                    <span className="text-white/40 text-sm mb-1">available</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/50">Subscription</span>
                            <TrendingUp className="w-3 h-3 text-[#FFFF00]" />
                        </div>
                        <div className="text-lg font-bold text-white tabular-nums">
                            {credits.subscription_credits.toLocaleString()}
                        </div>
                        {credits.subscription_expire_at && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-white/35">
                                <Calendar className="w-2.5 h-2.5" />
                                Expires {new Date(credits.subscription_expire_at).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/50">Permanent</span>
                            <Coins className="w-3 h-3 text-green-400" />
                        </div>
                        <div className="text-lg font-bold text-white tabular-nums">
                            {credits.permanent_credits.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/35 mt-1">Never expires</div>
                    </div>
                </div>
            </motion.div>

            {/* Current Plan */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-[#FFFF00]" />
                    <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Current Plan</span>
                </div>

                {subscription.has_active_subscription ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-white capitalize">
                                    {subscription.current_plan}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    Active
                                </span>
                            </div>
                            {subscription.subscription?.next_billing_date && (
                                <div className="text-xs text-white/40 mt-1">
                                    {subscription.subscription?.status === 'pending_cancellation' ? 'Expires on' : 'Renews on'}{' '}
                                    {new Date(subscription.subscription.next_billing_date).toLocaleString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => router.push('/#pricing-section')}
                            className="px-4 py-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-sm font-bold rounded-lg transition-colors"
                        >
                            Upgrade Plan
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-base font-medium text-white/50">No Active Plan</div>
                            <div className="text-xs text-white/30 mt-0.5">Subscribe to unlock premium features</div>
                        </div>
                        <button
                            onClick={() => router.push('/#pricing-section')}
                            className="px-4 py-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-sm font-bold rounded-lg transition-colors"
                        >
                            View Plans
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Top-Up Credits */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Coins className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Top-Up Permanent Credits</span>
                </div>

                {subscription.has_active_subscription ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {topUpPackages.map((pkg) => (
                            <button
                                key={pkg.credits}
                                className="flex flex-col items-center py-3 px-2 bg-black/30 hover:bg-white/10 border border-white/5 hover:border-[#FFFF00]/30 rounded-lg transition-all group"
                            >
                                <div className="text-base font-bold text-white group-hover:text-[#FFFF00] transition-colors">
                                    {pkg.credits.toLocaleString()}
                                </div>
                                <div className="text-xs text-white/40">credits</div>
                                <div className="text-sm font-bold text-[#FFFF00] mt-1">${pkg.price}</div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-white/3 rounded-lg p-3 border border-white/5">
                        <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <div className="text-xs text-white/40">
                            Subscribe to any plan to unlock permanent credit top-ups.
                        </div>
                        <button
                            onClick={() => router.push('/#pricing-section')}
                            className="ml-auto px-3 py-1.5 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                        >
                            View Plans
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
