"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Sparkles, Zap, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
    {
        name: "Starter",
        price: "$0",
        period: "top-up",
        desc: "Perfect for testing the waters.",
        features: ["5 Free Credits", "Standard Generation Speed", "Public Gallery", "720p Resolution"],
        popular: false
    },
    {
        name: "Creator",
        price: "$29",
        period: "month",
        desc: "For hobbyists and content creators.",
        features: ["1000 Credits/mo", "Fast Generation", "Private Gallery", "4K Resolution", "Priority Support"],
        popular: true,
        highlight: true
    },
    {
        name: "Professional",
        price: "$99",
        period: "month",
        desc: "Power users demanding the best.",
        features: ["Unlimited Slow Gen", "5000 Fast Credits", "Commercial License", "8K Resolution", "API Access", "24/7 Support"],
        popular: false
    }
]

export function PricingTableV2() {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

    return (
        <section className="py-24 bg-[#0a0a0a] border-t border-white/5">
            <div className="container mx-auto px-4">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/20 text-[#FFFF00] text-xs font-bold uppercase tracking-widest mb-4">
                            Option 2: Minimalist
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-4">
                            Simple, Transparent <br />
                            <span className="text-[#FFFF00]">Pricing.</span>
                        </h2>
                        <p className="text-white/50 max-w-md">
                            No hidden fees. Cancel anytime. Choose the plan that fits your creative needs.
                        </p>
                    </div>

                    {/* Toggle */}
                    <div className="bg-white/5 p-1 rounded-full flex items-center border border-white/10">
                        {['monthly', 'yearly'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setBilling(period as any)}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 capitalize",
                                    billing === period
                                        ? "bg-white text-black shadow-lg"
                                        : "text-white/50 hover:text-white"
                                )}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "relative p-8 rounded-3xl border transition-all duration-300 group flex flex-col",
                                plan.highlight
                                    ? "bg-[#FFFF00] border-[#FFFF00]" // Highlighted Card (Yellow)
                                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-black/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black">
                                        Best Value
                                    </div>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={cn("text-xl font-bold mb-2", plan.highlight ? "text-black" : "text-white")}>
                                    {plan.name}
                                </h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className={cn("text-5xl font-black font-heading", plan.highlight ? "text-black" : "text-white")}>
                                        {plan.price}
                                    </span>
                                    <span className={cn("text-sm font-bold opacity-60", plan.highlight ? "text-black" : "text-white")}>
                                        /{plan.period}
                                    </span>
                                </div>
                                <p className={cn("text-sm font-medium opacity-70", plan.highlight ? "text-black" : "text-white")}>
                                    {plan.desc}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                            plan.highlight ? "bg-black/10 text-black" : "bg-white/10 text-white"
                                        )}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className={cn("text-sm font-medium opacity-80", plan.highlight ? "text-black" : "text-white")}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button className={cn(
                                "w-full py-4 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 group/btn",
                                plan.highlight
                                    ? "bg-black text-white hover:bg-black/80"
                                    : "bg-white text-black hover:bg-white/90"
                            )}>
                                Choose Plan
                                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                            </button>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    )
}
