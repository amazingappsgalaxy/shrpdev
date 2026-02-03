"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ArrowRight, Loader2, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRICING_PLANS } from "@/lib/pricing-config"
import { useSession } from "@/lib/auth-client-simple"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type FREQUENCY = 'monthly' | 'yearly'

export function PricingTableNew() {
    const [frequency, setFrequency] = useState<FREQUENCY>('monthly')
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const { data: authData, isLoading: sessionLoading } = useSession()
    const router = useRouter()

    const handlePlanSelect = async (plan: any) => {
        setIsLoading(plan.name)
        try {
            if (sessionLoading) {
                setTimeout(() => { setIsLoading(null); handlePlanSelect(plan) }, 300)
                return
            }
            if (!authData?.user) {
                const planData = { plan: plan.name.toLowerCase().replace(/\s+/g, '_'), billingPeriod: frequency }
                localStorage.setItem('selectedPlan', JSON.stringify(planData))
                router.push('/app/login')
                return
            }

            const requestBody = { plan: plan.name.toLowerCase().replace(/\s+/g, '_'), billingPeriod: frequency }
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 20000)

            const response = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody),
                signal: controller.signal
            })
            clearTimeout(timeoutId)

            let data: any = null
            try { data = await response.json() } catch (e) { toast.error('Invalid response'); return }

            if (response.status === 401) {
                const planData = { plan: plan.name.toLowerCase().replace(/\s+/g, '_'), billingPeriod: frequency }
                localStorage.setItem('selectedPlan', JSON.stringify(planData))
                router.push('/app/login')
                return
            }
            if (!response.ok) { toast.error(data?.error || 'Failed'); return }
            if (data?.checkoutUrl) window.location.href = data.checkoutUrl
            else toast.error('No checkout URL')

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Checkout failed')
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <section className="py-32 bg-black relative overflow-hidden" id="pricing-new">
            <div className="container mx-auto px-4 relative z-10">
                {/* Header - Matches ShowcaseSection Exactly */}
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-bold font-heading text-white mb-6">
                        Simple, <br className="md:hidden" />
                        <span className="text-[#FFFF00]">Transparent Pricing.</span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
                        Choose the perfect plan for your creative journey. No hidden fees.
                    </p>

                    {/* Toggle Switch - Clean & Minimal */}
                    <div className="flex justify-center mt-10">
                        <div className="bg-white/5 p-1 rounded-full border border-white/10 flex items-center relative">
                            {['monthly', 'yearly'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setFrequency(period as any)}
                                    className={cn(
                                        "px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 capitalize relative z-10",
                                        frequency === period ? "text-black bg-white" : "text-white/60 hover:text-white"
                                    )}
                                >
                                    {period}
                                </button>
                            ))}
                            {/* Simple text badge */}
                            <div className="absolute -right-24 top-1/2 -translate-y-1/2 hidden sm:block">
                                <span className="text-[#FFFF00] text-xs font-bold uppercase tracking-wider">
                                    Save 15%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {PRICING_PLANS.map((plan, i) => {
                        const monthlyPrice = plan.price.monthly
                        const yearlyPrice = plan.price.yearly
                        const displayPrice = frequency === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice
                        const isPopular = plan.badge === "Most Popular"
                        const isPro = plan.name === "Professional"
                        const isHighlighted = isPopular || isPro

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col p-6 rounded-3xl transition-all duration-300 relative group",
                                    isHighlighted
                                        ? "bg-white/5 border border-[#FFFF00]/30 hover:border-[#FFFF00]/50"
                                        : "bg-transparent border border-white/10 hover:bg-white/5"
                                )}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <div className="absolute top-6 right-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            isHighlighted ? "bg-[#FFFF00] text-black" : "bg-white/10 text-white"
                                        )}>
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Plan Name */}
                                <div className="mb-2">
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                </div>

                                {/* Price */}
                                <div className="mb-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">${displayPrice}</span>
                                    <span className="text-white/40 text-sm">/mo</span>
                                </div>

                                {/* Button */}
                                <button
                                    onClick={() => handlePlanSelect(plan)}
                                    disabled={isLoading === plan.name}
                                    className={cn(
                                        "w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 mb-8 flex items-center justify-center gap-2",
                                        isHighlighted
                                            ? "bg-[#FFFF00] text-black hover:bg-[#E6E600]"
                                            : "bg-white/10 text-white hover:bg-white hover:text-black"
                                    )}
                                >
                                    {isLoading === plan.name ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Get Started
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                {/* Features - Limited to 5 lines */}
                                <div className="space-y-4 flex-1">
                                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Includes</p>
                                    <ul className="space-y-3">
                                        {plan.features.slice(0, 5).map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
                                                <Check className={cn(
                                                    "w-4 h-4 mt-0.5 shrink-0",
                                                    isHighlighted ? "text-[#FFFF00]" : "text-white/30"
                                                )} />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {plan.features.length > 5 && (
                                            <li className="text-xs text-white/30 pl-7 pt-1">
                                                + {plan.features.length - 5} more features
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
