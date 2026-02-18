'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { Coins, Crown, TrendingUp, Calendar } from 'lucide-react'
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
                // Fetch credits
                const creditsRes = await fetch('/api/credits/balance', {
                    credentials: 'include'
                })
                if (creditsRes.ok) {
                    const data = await creditsRes.json()
                    setCredits(data.balance)
                }

                // Fetch subscription
                const subRes = await fetch('/api/user/subscription', {
                    credentials: 'include'
                })
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
            <div className="space-y-6">
                <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Credits Display */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10 p-8"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#FFFF00]/10 rounded-xl">
                            <Coins className="w-6 h-6 text-[#FFFF00]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Total Credits</h2>
                    </div>

                    <div className="mb-6">
                        <div className="text-6xl font-bold text-white mb-2">
                            {credits.total.toLocaleString()}
                        </div>
                        <p className="text-white/50">Available credits</p>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-white/60">Subscription Credits</span>
                                <TrendingUp className="w-4 h-4 text-[#FFFF00]" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {credits.subscription_credits.toLocaleString()}
                            </div>
                            {credits.subscription_expire_at && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-white/40">
                                    <Calendar className="w-3 h-3" />
                                    Expires {new Date(credits.subscription_expire_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-white/60">Permanent Credits</span>
                                <Coins className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {credits.permanent_credits.toLocaleString()}
                            </div>
                            <div className="text-xs text-white/40 mt-2">
                                Never expires
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Current Plan */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#FFFF00]/10 rounded-xl">
                        <Crown className="w-6 h-6 text-[#FFFF00]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Current Plan</h2>
                </div>

                {subscription.has_active_subscription ? (
                    <div className="space-y-4">
                        <div>
                            <div className="text-3xl font-bold text-white capitalize mb-2">
                                {subscription.current_plan}
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Active
                            </div>
                        </div>

                        {subscription.subscription?.next_billing_date && (
                            <div className="text-white/60">
                                Renews on {new Date(subscription.subscription.next_billing_date).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        )}

                        <button
                            onClick={() => router.push('/#pricing-section')}
                            className="px-6 py-3 bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-lg transition-colors"
                        >
                            Upgrade Plan
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-xl text-white/60 mb-4">
                            No Active Plan
                        </div>
                        <p className="text-white/40 mb-6">
                            Subscribe to unlock premium features and get monthly credits.
                        </p>
                        <button
                            onClick={() => router.push('/#pricing-section')}
                            className="px-6 py-3 bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-lg transition-colors"
                        >
                            View Plans
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Top-Up Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-8"
            >
                <h2 className="text-2xl font-bold text-white mb-6">Top-Up Permanent Credits</h2>

                {subscription.has_active_subscription ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { credits: 500, price: 5 },
                            { credits: 1000, price: 9 },
                            { credits: 2500, price: 20 },
                            { credits: 5000, price: 35 }
                        ].map((pkg) => (
                            <button
                                key={pkg.credits}
                                className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFFF00]/50 rounded-xl transition-all group"
                            >
                                <div className="text-2xl font-bold text-white mb-2">
                                    {pkg.credits.toLocaleString()}
                                </div>
                                <div className="text-white/60 mb-4">credits</div>
                                <div className="text-[#FFFF00] font-bold text-xl">
                                    ${pkg.price}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-4xl mb-4">🔒</div>
                        <div className="text-xl font-bold text-white mb-2">
                            Top-Up Credits Locked
                        </div>
                        <p className="text-white/60 mb-6 max-w-md mx-auto">
                            Subscribe to any plan to unlock the ability to purchase permanent credits.
                        </p>
                        <button className="px-6 py-3 bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-lg transition-colors">
                            View Plans
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
