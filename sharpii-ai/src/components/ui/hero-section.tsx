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
    <section className="hero-section relative min-h-[90vh] w-full overflow-hidden flex items-center justify-center pt-20 bg-black">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Animated Glow Orbs */}
        <motion.div
          className="absolute -top-[20%] right-[10%] w-[800px] h-[800px] bg-accent-neon/5 rounded-full blur-[120px] mix-blend-screen"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[100px] mix-blend-screen"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-6 h-full flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8 hover:border-accent-neon/30 transition-colors duration-300"
            >
              <Sparkles className="w-4 h-4 text-accent-neon" />
              <span className="text-xs font-bold tracking-widest text-white uppercase">
                AI Enhancement Platform
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeInVariants}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8"
            >
              <span className="text-white block">
                Fix AI Skin &
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon via-white to-accent-blue animate-gradient-x">
                Generate Perfect Images
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInVariants}
              className="font-body text-xl text-white/60 leading-relaxed mb-10 max-w-xl"
            >
              Professional AI skin enhancement and image generation platform. Fix AI-generated skin textures, upscale to 4K resolution, and create photorealistic portraits with our advanced AI engine.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInVariants}
              className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-16"
            >
              <Button
                size="lg"
                className="btn-primary w-full sm:w-auto px-10 py-7 text-lg shadow-neon hover:shadow-neon-strong transition-all duration-300 group"
                asChild
              >
                <Link href="/app/signup">
                  <span className="flex items-center gap-3">
                    Start Enhancing
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto px-10 py-7 text-lg font-medium text-white glass hover:bg-white/10 border border-white/10"
                asChild
              >
                <Link href="/demo" className="flex items-center gap-3">
                  <Play className="h-4 w-4 fill-white" />
                  Live Demo
                </Link>
              </Button>
            </motion.div>

            {/* Feature Highlights - Replacing Trust Indicator */}
            <motion.div variants={fadeInVariants} className="flex flex-wrap items-center gap-6 text-white/40 text-sm font-medium border-t border-white/5 pt-8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-neon" />
                <span className="text-white/70">AI Skin Enhancement</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-blue" />
                <span className="text-white/70">4K Upscaling</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-purple" />
                <span className="text-white/70">Video Generation</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Platform Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block perspective-1000"
          >
            {/* Main Application Interface Mockup */}
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0A0A0A]">
              {/* Window Controls */}
              <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>

              {/* UI Layout */}
              <div className="flex h-[500px]">
                {/* Sidebar */}
                <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-neon/20 flex items-center justify-center text-accent-neon">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/5" />
                  <div className="w-8 h-8 rounded-lg bg-white/5" />
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative bg-grid-white/[0.02]">
                  <Image
                    src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/herodesktop.jpeg"
                    alt="Platform Interface"
                    fill
                    className="object-cover opacity-80"
                  />

                  {/* Floating Action Cards */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute top-6 right-6 w-64 glass-card p-4 rounded-xl border border-white/10 shadow-xl backdrop-blur-md"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-white">Enhancing...</span>
                      <span className="text-xs font-mono text-accent-neon">94%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "94%" }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                        className="h-full bg-accent-neon"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-6 left-6 px-4 py-3 glass-elevated rounded-lg flex items-center gap-3 border border-white/20"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Upscale Complete</div>
                      <div className="text-[10px] text-white/50">4K Ultra Resolution</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Back Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-accent-neon/20 blur-[100px] -z-10 opacity-50 pointer-events-none" />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
