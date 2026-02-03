"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ArrowRight, Sparkles, Loader2, Zap, Crown, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PRICING_PLANS, PRICING_CONFIG } from "@/lib/pricing-config"
import { useSession } from "@/lib/auth-client-simple"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type FREQUENCY = 'monthly' | 'yearly'

export function PricingTableNew() {
    const [frequency, setFrequency] = useState<FREQUENCY>('monthly')
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
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
                const planData = {
                    plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
                    billingPeriod: frequency
                }
                localStorage.setItem('selectedPlan', JSON.stringify(planData))
                router.push('/app/login')
                return
            }

            const requestBody = {
                plan: plan.name.toLowerCase().replace(/\s+/g, '_'),
                billingPeriod: frequency
            }

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
        <section className="py-24 bg-black relative overflow-hidden" id="pricing-new">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFFF00]/20 bg-[#FFFF00]/5 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-[#FFFF00]" />
                        <span className="text-sm font-bold text-[#FFFF00] uppercase tracking-wider">New Pricing Design</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-bold font-heading text-white tracking-tight">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFF00] to-yellow-600">Power</span>
                    </h2>

                    {/* Toggle */}
                    <div className="flex justify-center mt-8">
                        <div className="p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-lg relative">
                            {['monthly', 'yearly'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setFrequency(period as any)}
                                    className={cn(
                                        "relative px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 capitalize z-10",
                                        frequency === period ? "text-black" : "text-white/60 hover:text-white"
                                    )}
                                >
                                    {period}
                                    {frequency === period && (
                                        <motion.div
                                            layoutId="pricing-toggle"
                                            className="absolute inset-0 bg-[#FFFF00] rounded-full shadow-[0_0_20px_rgba(255,255,0,0.4)] -z-10"
                                        />
                                    )}
                                    {period === 'yearly' && (
                                        <span className={cn(
                                            "ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider border",
                                            frequency === period ? "bg-black/20 border-transparent text-black" : "bg-[#FFFF00]/20 border-[#FFFF00]/30 text-[#FFFF00]"
                                        )}>
                                            -15%
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto items-stretch">
                    {PRICING_PLANS.map((plan, i) => {
                        const monthlyPrice = plan.price.monthly
                        const yearlyPrice = plan.price.yearly
                        const displayPrice = frequency === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice
                        const isPopular = plan.badge === "Most Popular" || plan.badge === "Popular"
                        const isEnterprise = plan.name === "Enterprise"

                        return (
                            <motion.div
                                key={i}
                                onHoverStart={() => setHoveredPlan(plan.name)}
                                onHoverEnd={() => setHoveredPlan(null)}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "group relative p-1 rounded-[2.5rem] transition-all duration-500",
                                    isPopular ? "bg-gradient-to-b from-[#FFFF00]/50 to-transparent" : "bg-white/5 hover:bg-white/10"
                                )}
                            >
                                {/* Card Content */}
                                <div className="relative h-full bg-[#0a0a0a] rounded-[2.3rem] p-8 border border-white/5 overflow-hidden flex flex-col">
                                    {/* Hover Gradient */}
                                    <div className={cn(
                                        "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100",
                                        isPopular ? "from-[#FFFF00]/10 via-transparent to-transparent" : "from-white/5 to-transparent"
                                    )} />

                                    {plan.badge && (
                                        <div className="absolute top-0 right-0 p-6">
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md",
                                                isPopular
                                                    ? "bg-[#FFFF00] text-black border-[#FFFF00] shadow-[0_0_20px_rgba(255,255,0,0.3)]"
                                                    : "bg-white/10 text-white border-white/20"
                                            )}>
                                                {plan.badge}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-8 relative z-10">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                                            isPopular ? "bg-[#FFFF00] text-black" : "bg-white/10 text-white"
                                        )}>
                                            {plan.icon ? <plan.icon className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                        </div>

                                        <h3 className="text-xl font-bold font-heading text-white mb-2">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1 mb-4">
                                            <span className={cn(
                                                "text-4xl font-black tracking-tight",
                                                isPopular ? "text-[#FFFF00]" : "text-white"
                                            )}>
                                                ${displayPrice}
                                            </span>
                                            <span className="text-sm font-medium text-white/40">/month</span>
                                        </div>
                                        <p className="text-sm text-white/50 leading-relaxed font-medium min-h-[40px]">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

                                    <ul className="space-y-4 mb-8 flex-1 relative z-10">
                                        {plan.features.slice(0, 6).map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm">
                                                <div className={cn(
                                                    "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                                                    isPopular ? "bg-[#FFFF00]/20 text-[#FFFF00]" : "bg-white/10 text-white/60 group-hover:text-white"
                                                )}>
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                                <span className="text-white/70 group-hover:text-white transition-colors">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                        {plan.features.length > 6 && (
                                            <li className="text-xs text-white/30 italic pl-7">
                                                + {plan.features.length - 6} more features
                                            </li>
                                        )}
                                    </ul>

                                    <button
                                        onClick={() => handlePlanSelect(plan)}
                                        disabled={isLoading === plan.name}
                                        className={cn(
                                            "w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group/btn relative overflow-hidden",
                                            isPopular
                                                ? "bg-[#FFFF00] text-black hover:bg-[#e6e600] shadow-[0_0_30px_-5px_rgba(255,255,0,0.4)]"
                                                : "bg-white text-black hover:bg-white/90"
                                        )}
                                    >
                                        {isLoading === plan.name ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Processing
                                            </>
                                        ) : (
                                            <>
                                                Get Started
                                                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
