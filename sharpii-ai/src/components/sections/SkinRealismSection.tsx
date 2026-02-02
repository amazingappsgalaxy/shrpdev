"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Shield, Target, Award, Sparkles, Check } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function SkinRealismSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
  }

  return (
    <section className="relative py-32 overflow-hidden bg-black/40">

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">

        {/* Header */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-24"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8">
            <Sparkles className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-bold text-white/90 uppercase tracking-widest">Cinema Grade Realism</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white block">Achieve New Levels of</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Skin Realism
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg text-white/60 leading-relaxed max-w-3xl mx-auto">
            Our advanced AI technology delivers unprecedented skin enhancement that maintains natural texture and authenticity.
            Experience results that preserve the essence of natural beauty.
          </motion.p>
        </motion.div>

        {/* Enhanced Comparison Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid lg:grid-cols-2 gap-12 mb-32"
        >
          {/* Portrait Card */}
          <motion.div variants={imageVariants} className="relative group">
            <div className="relative rounded-[2.5rem] overflow-hidden glass-elevated border border-white/10 shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
              <div className="aspect-[4/5] relative">
                <Image
                  src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+After.png"
                  alt="Enhanced Portrait"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                <div className="absolute top-6 right-6">
                  <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Portrait Mode</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Studio Portrait</h3>
                  <div className="space-y-3">
                    {["Micro-texture preservation", "Subtle pore refinement", "Natural lighting balance"].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent-blue" />
                        </div>
                        <span className="text-sm font-medium text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fashion Card */}
          <motion.div variants={imageVariants} className="relative group lg:mt-16">
            <div className="relative rounded-[2.5rem] overflow-hidden glass-elevated border border-white/10 shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)]">
              <div className="aspect-[4/5] relative">
                <Image
                  src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
                  alt="Enhanced Fashion"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                <div className="absolute top-6 left-6">
                  <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">High Fashion</span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Editorial</h3>
                  <div className="space-y-3">
                    {["Commercial grade polish", "Magazine ready output", "Color grading match"].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent-purple/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent-purple" />
                        </div>
                        <span className="text-sm font-medium text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: <Shield className="h-6 w-6" />,
              title: "Studio Quality",
              description: "Achieve studio-grade results without expensive lighting.",
              color: "text-accent-blue",
              bg: "bg-accent-blue/10",
              delay: 0.1
            },
            {
              icon: <Target className="h-6 w-6" />,
              title: "Precision Control",
              description: "Target specific areas while maintaining characteristics.",
              color: "text-accent-neon",
              bg: "bg-accent-neon/10",
              delay: 0.2
            },
            {
              icon: <Award className="h-6 w-6" />,
              title: "Industry Standard",
              description: "Meets global professional photography requirements.",
              color: "text-accent-pink",
              bg: "bg-accent-pink/10",
              delay: 0.3
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-8 rounded-3xl glass-card border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-300"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors", feature.bg)}>
                <div className={feature.color}>{feature.icon}</div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Processing Speed Indicator */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full glass-card border border-white/10 hover:border-accent-neon/30 hover:bg-white/5 transition-all cursor-default">
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-neon"></span>
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Processing Time</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="font-mono text-accent-neon font-bold">~1.2s / photo</span>
          </div>
        </motion.div>

      </div>
    </section>
  )
}