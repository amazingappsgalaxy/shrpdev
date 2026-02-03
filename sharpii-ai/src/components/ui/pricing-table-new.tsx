"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ArrowRight, Loader2, Sparkles, Zap, Star, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRICING_PLANS } from "@/lib/pricing-config"
import { useSession } from "@/lib/auth-client-simple"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from '@/components/ui/button'

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
        <section className="py-24 relative bg-black overflow-hidden" id="pricing-new">
            {/* Simplified Background Ambience */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header - Simpler, Cleaner */}
                <div className="text-center max-w-4xl mx-auto mb-20">
                    {/* Replaced 'Zap' badge with simpler text badge or removed */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 mb-8 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 text-[#FFFF00]" />
                        <span className="text-xs font-bold font-sans text-white/80 uppercase tracking-widest">
                            Official Pricing
                        </span>
                    </div>

                    {/* New Heading - Simple & Direct */}
                    <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 leading-tight text-white tracking-tight">
                        Start Your <span className="text-[#FFFF00]">Journey.</span>
                    </h2>

                    <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed font-sans">
                        Transparent pricing for everyone. Upgrade, downgrade, or cancel anytime.
                    </p>

                    {/* Updated Toggle Switch with Original Layout + Logic */}
                    <div className="flex justify-center mt-12">
                        <div className="flex items-center gap-4">
                            <span className={cn("text-sm font-bold transition-colors", frequency === 'monthly' ? "text-white" : "text-white/40")}>Monthly</span>
                            <div
                                className="w-14 h-7 bg-white/10 rounded-full p-1 cursor-pointer transition-colors relative"
                                onClick={() => setFrequency(frequency === 'monthly' ? 'yearly' : 'monthly')}
                            >
                                <motion.div
                                    className="w-5 h-5 bg-[#FFFF00] rounded-full shadow-lg"
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    animate={{ x: frequency === 'monthly' ? 0 : 28 }}
                                />
                            </div>
                            <span className={cn("text-sm font-bold transition-colors flex items-center gap-2", frequency === 'yearly' ? "text-white" : "text-white/40")}>
                                Yearly
                                <span className="text-[#FFFF00] text-xs bg-[#FFFF00]/10 px-2 py-0.5 rounded-full border border-[#FFFF00]/20">
                                    -20%
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto items-stretch">
                    {PRICING_PLANS.map((plan, i) => {
                        const monthlyPrice = plan.price.monthly
                        const yearlyPrice = plan.price.yearly
                        const displayPrice = frequency === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice
                        const isCreator = plan.name === "Creator"
                        const isPro = plan.name === "Professional"

                        const isHighlighted = isCreator || isPro
                        const savingsPercent = Math.round((1 - (yearlyPrice / (monthlyPrice * 12))) * 100)

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col p-6 lg:p-8 rounded-[2rem] transition-all duration-300 relative group h-full overflow-hidden border",
                                    isCreator
                                        ? "bg-[#FFFF00] text-black border-[#FFFF00] shadow-[0_0_50px_rgba(255,255,0,0.15)]"
                                        : isPro
                                            ? "text-white border-[#FFFF00]/30 shadow-[0_0_50px_rgba(255,215,0,0.1)] relative" // Pro Styles below
                                            : "bg-[#0A0A0A] border-white/5 text-white hover:border-white/10"
                                )}
                            >
                                {/* PROFESSIONAL PLAN STYLING: Premium Gradient + Mesh */}
                                {isPro && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-black z-0" />
                                        {/* Subtle Animated Gold Mesh */}
                                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FFD700_1px,transparent_1px)] [background-size:16px_16px] z-0" />
                                        {/* Top Light Source */}
                                        <div className="absolute top-0 inset-x-0 h-[150px] bg-gradient-to-b from-[#FFD700]/10 to-transparent blur-xl z-0" />
                                    </>
                                )}

                                {/* Popular Badge */}
                                {plan.badge && (
                                    <div className="absolute top-5 right-6 z-20">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                            isCreator
                                                ? "bg-black/90 text-[#FFFF00]"
                                                : isPro
                                                    ? "bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20"
                                                    : "bg-white/10 text-white"
                                        )}>
                                            {isPro && <Crown className="w-3 h-3 fill-current" />}
                                            {isCreator && <Star className="w-3 h-3 fill-current" />}
                                            {plan.badge}
                                        </div>
                                    </div>
                                )}

                                {/* Plan Name */}
                                <div className="mb-6 pt-2 relative z-20">
                                    <h3 className={cn(
                                        "text-lg font-bold uppercase tracking-wider font-sans",
                                        isCreator ? "text-black/80" : "text-white/80"
                                    )}>
                                        {plan.name}
                                    </h3>
                                    <p className={cn(
                                        "text-xs font-medium mt-1 leading-relaxed opacity-60 font-sans",
                                        isCreator ? "text-black" : "text-white"
                                    )}>
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Price - Syne Font with lighter weight (Regular/Medium instead of Black) */}
                                <div className="mb-8 relative z-20">
                                    <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                            "text-4xl md:text-5xl font-bold font-heading tracking-tight", // CHANGED: font-bold instead of font-black
                                            isCreator ? "text-black" : isPro ? "text-[#FFD700]" : "text-white"
                                        )}>${displayPrice}</span>
                                        <span className={cn(
                                            "text-xs font-bold uppercase font-sans mb-1",
                                            isCreator ? "text-black/50" : "text-white/40"
                                        )}>/mo</span>
                                    </div>

                                    {frequency === 'yearly' && (
                                        <div className={cn(
                                            "mt-2 text-[10px] font-bold uppercase tracking-wide font-sans px-2 py-0.5 rounded w-fit",
                                            isCreator ? "bg-black/5 text-black/70" : "bg-[#FFFF00]/10 text-[#FFFF00]"
                                        )}>
                                            Billed ${yearlyPrice}/yr
                                        </div>
                                    )}
                                </div>

                                {/* Credits Highlight */}
                                <div className={cn(
                                    "mb-8 p-4 rounded-xl border flex items-center gap-3 relative z-20",
                                    isCreator
                                        ? "bg-white/20 border-black/5"
                                        : isPro
                                            ? "bg-gradient-to-r from-[#FFD700]/10 to-transparent border-[#FFD700]/20"
                                            : "bg-white/5 border-white/5"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        isCreator ? "bg-black text-[#FFFF00]" : isPro ? "bg-[#FFD700] text-black" : "bg-white/10 text-white"
                                    )}>
                                        <Zap className="w-4 h-4 fill-current" />
                                    </div>
                                    <div>
                                        <div className={cn("text-base font-bold font-sans", isCreator ? "text-black" : "text-white")}>
                                            {plan.credits.monthly} Credits
                                        </div>
                                        <div className={cn("text-[8px] uppercase font-bold tracking-wider opacity-60 font-sans", isCreator ? "text-black" : "text-white")}>
                                            Per Month
                                        </div>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="space-y-4 mb-8 flex-1 relative z-20">
                                    <ul className="space-y-2.5">
                                        {plan.features.slice(0, 7).map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                    isCreator ? "bg-black/10 text-black" : isPro ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-white/10 text-white/30"
                                                )}>
                                                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-medium font-sans leading-relaxed",
                                                    isCreator ? "text-black/80" : "text-white/70"
                                                )}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* New Button Style - Matched to Header Style but adapted */}
                                <div className="mt-auto relative z-20">
                                    <Button
                                        onClick={() => handlePlanSelect(plan)}
                                        disabled={isLoading === plan.name}
                                        className={cn(
                                            "w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
                                            // Default styles
                                            "shadow-lg hover:translate-y-[-2px]",

                                            isCreator
                                                ? "bg-black text-white hover:bg-black/80 hover:shadow-xl"
                                                : isPro
                                                    ? "bg-gradient-to-r from-[#FFD700] to-[#E6E600] text-black hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                                                    : "bg-white text-black hover:bg-white/90"
                                        )}
                                    >
                                        {isLoading === plan.name ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Get Started
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
