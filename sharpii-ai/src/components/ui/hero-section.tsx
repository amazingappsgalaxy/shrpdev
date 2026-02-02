"use client"

import { motion, Variants } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play, Sparkles, Zap } from "lucide-react"
import Image from "next/image"

import { Button } from "./button"
import { SparklesText } from "./sparkles-text"

import { staggerContainerVariants } from "@/lib/animations"

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

export function HeroSection() {
  return (
    <section className="hero-section relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-20">
      {/* Background Image with Parallax & Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "circOut" }}
        >
          <Image
            src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/herodesktop.jpeg"
            alt="AI Image Enhancement Hero"
            fill
            className="object-cover opacity-60"
            priority
            quality={100}
          />
          {/* Enhanced Gradient Overlays for Depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-blue/5 via-transparent to-transparent opacity-50" />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-6">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Premium Badge */}
          <motion.div
            variants={fadeInVariants}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-elevated border border-white/10 mb-8 hover:border-accent-blue/30 transition-colors duration-300"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-3 h-3 bg-accent-neon rounded-full animate-ping opacity-75"></div>
              <div className="relative w-2 h-2 bg-accent-neon rounded-full"></div>
            </div>
            <span className="text-sm font-medium tracking-wide text-white/90 uppercase">
              Next-Gen AI Enhancement
            </span>
          </motion.div>

          {/* Main Heading - Massive & Impactful */}
          <motion.h1
            variants={fadeInVariants}
            className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight mb-8 drop-shadow-2xl"
          >
            <span className="text-white block mb-2">
              Transform Content
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink animate-gradient-x block">
              With Pure AI
            </span>
          </motion.h1>

          {/* Subtitle - Clean & Readable */}
          <motion.p
            variants={fadeInVariants}
            className="font-body text-lg sm:text-xl md:text-2xl text-white/60 leading-relaxed mb-12 max-w-3xl mx-auto"
          >
            Professional-grade image upscaling and enhancement powered by neural networks.
            Experience <span className="text-white font-semibold">cinematic clarity</span> in milliseconds.
          </motion.p>

          {/* High-Impact CTA Buttons */}
          <motion.div
            variants={fadeInVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
          >
            <Button
              size="lg"
              className="group relative overflow-hidden rounded-full bg-white text-black px-10 py-8 text-lg font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)] transition-all duration-300 transform hover:-translate-y-1"
              asChild
            >
              <Link href="/app/signup">
                <span className="relative z-10 flex items-center gap-3">
                  Start Creating Free
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="group rounded-full px-10 py-8 text-lg font-medium text-white glass border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              asChild
            >
              <Link href="/demo" className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-accent-blue/20 transition-colors">
                  <Play className="h-4 w-4 fill-current" />
                </div>
                See How It Works
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators / Stats */}
          <motion.div
            variants={fadeInVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/5 pt-12"
          >
            {[
              { label: "Active Users", value: "50K+" },
              { label: "Images Processed", value: "10M+" },
              { label: "Average Rating", value: "4.9/5" },
              { label: "Processing Speed", value: "< 2s" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-heading font-bold text-white mb-1">{stat.value}</span>
                <span className="text-xs uppercase tracking-widest text-white/40 font-medium">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>
    </section>
  )
}
