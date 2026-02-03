"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
            {/* Vibrant Background Elements matching Hero */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/20 to-transparent" />
                <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[150px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[800px] h-[800px] bg-[#FFFF00]/10 rounded-full blur-[200px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header - Matches Hero Vibe */}
                <div className="text-center max-w-4xl mx-auto mb-20 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FFFF00]/30 bg-[#FFFF00]/5 backdrop-blur-sm mx-auto">
                        <Zap className="w-4 h-4 text-[#FFFF00] fill-[#FFFF00]" />
                        <span className="text-xs font-bold text-[#FFFF00] tracking-[0.2em] uppercase">
                            Flexible Plans
                        </span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black font-heading text-white tracking-tight leading-[1.1]">
                        Unleash Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFF00] to-[#E6E600]">Creative Power</span>
                    </h2>

                    {/* Custom Toggle Switch */}
                    <div className="flex justify-center mt-10">
                        <div className="bg-white/5 border border-white/10 p-1.5 rounded-full backdrop-blur-md flex relative">
                            {['monthly', 'yearly'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setFrequency(period as any)}
                                    className={cn(
                                        "px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 relative z-10 font-heading",
                                        frequency === period ? "text-black" : "text-white/60 hover:text-white"
                                    )}
                                >
                                    {period}
                                    {frequency === period && (
                                        <motion.div
                                            layoutId="active-period"
                                            className="absolute inset-0 bg-[#FFFF00] rounded-full shadow-[0_0_20px_rgba(255,255,0,0.5)] -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                </button>
                            ))}

                            {/* Discount Badge */}
                            <div className="absolute -right-24 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-[#FFFF00]" />
                                <span className="text-[#FFFF00] font-bold font-heading text-sm uppercase tracking-wider">
                                    Save 15%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {PRICING_PLANS.map((plan, i) => {
                        const monthlyPrice = plan.price.monthly
                        const yearlyPrice = plan.price.yearly
                        const displayPrice = frequency === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice
                        const isPopular = plan.badge === "Most Popular" || plan.badge === "Popular"
                        const isCreator = plan.name === "Creator"
                        const isPro = plan.name === "Professional"

                        // Determine Highlight State
                        const isHighlighted = isCreator || isPro

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "group relative p-6 rounded-[2rem] border transition-all duration-500 flex flex-col h-full",
                                    isHighlighted
                                        ? "bg-black border-[#FFFF00] shadow-[0_0_50px_-20px_rgba(255,255,0,0.3)] scale-[1.02] z-10"
                                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                )}
                            >
                                {/* Popular Badge */}
                                {plan.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-black font-heading uppercase tracking-widest border shadow-lg",
                                            isHighlighted
                                                ? "bg-[#FFFF00] text-black border-[#FFFF00]"
                                                : "bg-white text-black border-white"
                                        )}>
                                            {plan.badge}
                                        </div>
                                    </div>
                                )}

                                {/* Card Header */}
                                <div className="mb-8 text-center pt-6">
                                    <h3 className={cn(
                                        "text-2xl font-black font-heading mb-4 uppercase tracking-tight",
                                        isHighlighted ? "text-[#FFFF00]" : "text-white"
                                    )}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <span className="text-2xl font-bold font-heading text-white/40">$</span>
                                        <span className={cn(
                                            "text-6xl font-black font-heading tracking-tighter",
                                            "text-white"
                                        )}>
                                            {displayPrice}
                                        </span>
                                    </div>
                                    <div className="text-sm font-bold font-heading text-white/40 uppercase tracking-widest">
                                        Per Month
                                    </div>
                                    {frequency === 'yearly' && (
                                        <div className="mt-2 text-xs font-bold font-heading text-[#FFFF00]">
                                            Billed ${yearlyPrice} / Year
                                        </div>
                                    )}
                                </div>

                                {/* CTA Button - Matches Hero Style */}
                                <button
                                    onClick={() => handlePlanSelect(plan)}
                                    disabled={isLoading === plan.name}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-black font-heading text-sm uppercase tracking-widest transition-all duration-300 mb-10 flex items-center justify-center gap-2 relative overflow-hidden group/btn",
                                        isHighlighted
                                            ? "bg-[#FFFF00] text-black hover:bg-[#D4D400] hover:scale-105 shadow-[0_4px_20px_rgba(255,255,0,0.25)]"
                                            : "bg-white/10 text-white border border-white/10 hover:bg-white hover:text-black hover:border-white"
                                    )}
                                >
                                    {isLoading === plan.name ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Get Started
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                        </>
                                    )}
                                </button>

                                {/* Features */}
                                <div className="space-y-6 flex-1">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-3xl font-black font-heading text-white">
                                                {plan.credits.monthly.toLocaleString()}
                                            </span>
                                            <Zap className={cn("w-5 h-5 mb-1", isHighlighted ? "text-[#FFFF00] fill-[#FFFF00]" : "text-white/40")} />
                                        </div>
                                        <div className="text-[10px] font-bold font-heading text-white/50 uppercase tracking-widest">
                                            Credits / Month
                                        </div>
                                    </div>

                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 group/item">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                    isHighlighted ? "bg-[#FFFF00]/20 text-[#FFFF00]" : "bg-white/10 text-white/40 group-hover/item:text-white"
                                                )}>
                                                    <Check className="w-3 h-3" strokeWidth={3} />
                                                </div>
                                                <span className="text-sm font-medium text-white/70 group-hover/item:text-white transition-colors leading-relaxed">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
