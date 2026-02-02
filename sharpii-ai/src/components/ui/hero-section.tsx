"use client"

import { motion, Variants } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play, Sparkles, Zap, Layers, Wand2 } from 'lucide-react'
import Image from "next/image"

import { Button } from '@/components/ui/button'
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
    <section className="hero-section relative min-h-[95vh] w-full overflow-hidden flex items-center justify-center pt-24 bg-black">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Animated Glow Orbs - More Vibey */}
        <motion.div
          className="absolute -top-[20%] right-[10%] w-[1000px] h-[1000px] bg-accent-neon/10 rounded-full blur-[150px] mix-blend-screen"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[0%] left-[0%] w-[800px] h-[800px] bg-accent-blue/10 rounded-full blur-[150px] mix-blend-screen"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Abstract Digital Noise / Grain */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-6 h-full flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center w-full">

          {/* Left Column: Text Content */}
          <motion.div
            className="text-left"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Premium Badge */}
            <motion.div
              variants={fadeInVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-accent-neon/20 mb-8 hover:border-accent-neon/50 transition-colors duration-300"
            >
              <Sparkles className="w-4 h-4 text-accent-neon" />
              <span className="text-xs font-bold tracking-widest text-accent-neon uppercase">
                Next-Gen Image Engine
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeInVariants}
              className="font-heading text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-8"
            >
              <span className="text-white block">
                Create &
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon via-[#fff] to-accent-neon animate-gradient-x">
                Enhance
              </span>
              <span className="text-white block text-4xl sm:text-5xl lg:text-6xl font-normal mt-2 tracking-normal font-sans">
                Reality.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInVariants}
              className="font-body text-xl text-white/50 leading-relaxed mb-12 max-w-xl"
            >
              The ultimate AI platform for professional image generation and sub-pixel enhancement. Transform low-res inputs into 8K masterpieces instantly.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInVariants}
              className="flex flex-col sm:flex-row items-center justify-start gap-5 mb-16"
            >
              <Button
                size="lg"
                className="btn-premium w-full sm:w-auto px-10 py-8 text-xl group"
                asChild
              >
                <Link href="/app/signup">
                  <span className="flex items-center gap-3">
                    Start Creating
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto px-10 py-8 text-xl font-medium text-white glass-elevated border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                asChild
              >
                <Link href="/demo" className="flex items-center gap-3">
                  <Play className="h-5 w-5 fill-white" />
                  Live Demo
                </Link>
              </Button>
            </motion.div>

          </motion.div>

          {/* Right Column: Visual Spectacle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Main Visual Composition */}
            <div className="relative w-full aspect-square">
              {/* Central Art Element */}
              <div className="absolute inset-0 z-20 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl glass-premium group">
                <Image
                  src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/herodesktop.jpeg"
                  alt="AI Masterpiece"
                  fill
                  className="object-cover scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                  priority
                />

                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* "Clean" UI Overlay - Minimalist */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="glass-elevated px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Generative 8K</span>
                  </div>
                </div>
              </div>

              {/* Decorative Floating Elements (Behind) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute -top-10 -right-10 w-full h-full border border-white/5 rounded-full z-0 opacity-40"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-10 -left-10 w-3/4 h-3/4 border border-dashed border-accent-neon/20 rounded-full z-0 opacity-30"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
