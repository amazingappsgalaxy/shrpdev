"use client"

import { motion, Variants } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import {
  Sparkles, Eye, Palette, Brain, Layers, Award,
  TrendingUp, Clock, Users, Heart, Download, Play, CheckCircle, Cpu, ArrowRight
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function UnifiedEnhancementSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeFeature, setActiveFeature] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const enhancementSuite = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Neural Skin Analysis",
      description: "Advanced AI analyzes 50+ skin parameters for personalized enhancement.",
      stats: "99.2% accuracy",
      color: "text-accent-blue"
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Multi-Layer Processing",
      description: "Separate enhancement layers for skin, eyes, hair, and background.",
      stats: "4-layer depth",
      color: "text-accent-purple"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Texture Preservation",
      description: "Maintains natural skin texture while removing imperfections.",
      stats: "95% detail retention",
      color: "text-accent-neon"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Intelligent Eye Enhancement",
      description: "Brightens eyes, enhances iris detail, and removes red-eye.",
      stats: "3x clarity boost",
      color: "text-accent-pink"
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Color Harmonization",
      description: "Balances skin tones and corrects color temperature automatically.",
      stats: "Auto-calibration",
      color: "text-accent-cyan"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Professional Quality",
      description: "Studio-grade results suitable for commercial photography.",
      stats: "8K output ready",
      color: "text-white"
    }
  ]

  const processingSteps = [
    { name: "Analyzing", description: "AI examines facial structure", duration: 2000 },
    { name: "Enhancing", description: "Applying skin improvements", duration: 3000 },
    { name: "Refining", description: "Fine-tuning details", duration: 2000 },
    { name: "Complete", description: "Professional result ready", duration: 1000 }
  ]

  const performanceMetrics = [
    { icon: <TrendingUp className="h-5 w-5" />, label: "Quality Improvement", value: "94.8%" },
    { icon: <Clock className="h-5 w-5" />, label: "Processing Speed", value: "< 15s" },
    { icon: <Users className="h-5 w-5" />, label: "Satisfied Users", value: "50K+" },
    { icon: <Heart className="h-5 w-5" />, label: "Natural Results", value: "99.1%" }
  ]

  const startProcessing = () => {
    setIsProcessing(true)
    setCurrentStep(0)

    let accumulatedTime = 0
    processingSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1)
        if (index === processingSteps.length - 1) {
          setTimeout(() => {
            setIsProcessing(false)
            setCurrentStep(0)
          }, step.duration)
        }
      }, accumulatedTime)
      accumulatedTime += step.duration
    })
  }

  return (
    <section className="py-24 relative overflow-hidden bg-black/40">

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-[120px]" />
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
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8"
          >
            <Sparkles className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-widest">
              Next-Gen AI Core
            </span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white block">Complete Portrait</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink">
              Enhancement Suite
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
            Revolutionary AI technology that transforms portraits with unprecedented precision,
            preserving natural beauty while delivering professional-grade enhancements.
          </motion.p>
        </motion.div>

        {/* Metrics Bar */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {performanceMetrics.map((metric, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-white/5 hover:bg-white/5 transition-colors"
            >
              <div className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">{metric.value}</div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                {metric.icon}
                <span>{metric.label}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {enhancementSuite.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setActiveFeature(index)}
              onMouseLeave={() => setActiveFeature(null)}
              className="group relative"
            >
              <div className={cn(
                "relative h-full p-8 rounded-3xl glass-card border border-white/10 transition-all duration-300",
                "hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl"
              )}>
                {/* Hover Glow */}
                <div className={cn(
                  "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"
                )} />

                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300",
                  "bg-white/5 border border-white/10 group-hover:bg-white/10",
                  feature.color
                )}>
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">{feature.description}</p>

                <div className="flex items-center gap-2 text-xs font-mono text-accent-neon uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse" />
                  {feature.stats}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Processing Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-5xl"
        >
          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="text-center mb-12 relative z-10">
              <h3 className="text-3xl font-bold text-white mb-4">See It In Action</h3>
              <p className="text-white/60">Watch how our neural network layers enhancements in real-time.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Visualizer */}
              <div className="space-y-6">
                <div className="relative aspect-square rounded-2xl overflow-hidden glass-elevated border border-white/10">
                  <Image
                    src={isProcessing ? "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png" : "https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"}
                    alt="Demo"
                    fill
                    className={cn(
                      "object-cover transition-all duration-[2000ms]",
                      isProcessing && "scale-105"
                    )}
                  />

                  {/* Scanning Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-accent-blue/20 animate-pulse pointer-events-none z-10" />
                  )}

                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/60 rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-widest backdrop-blur-md">
                      {isProcessing ? "Processing..." : "Ready"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={startProcessing}
                  disabled={isProcessing}
                  className="w-full btn-premium py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Cpu className="animate-spin h-5 w-5" />
                      <span>Enhancing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 fill-current" />
                      <span>Run Simulation</span>
                    </>
                  )}
                </button>
              </div>

              {/* Steps Visualizer */}
              <div className="space-y-4">
                {processingSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-300 flex items-center gap-4",
                      currentStep > idx ? "bg-accent-blue/10 border-accent-blue/30" :
                        currentStep === idx ? "bg-white/10 border-white/30 scale-105 shadow-xl" : "bg-transparent border-white/5 opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                      currentStep > idx ? "bg-accent-blue text-white" :
                        currentStep === idx ? "bg-white text-black" : "bg-white/10 text-white/40"
                    )}>
                      {currentStep > idx ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className={cn(
                        "font-bold text-sm",
                        currentStep === idx ? "text-white" : "text-white/60"
                      )}>{step.name}</div>
                      <div className="text-xs text-white/40">{step.description}</div>
                    </div>
                    {currentStep === idx && (
                      <Cpu className="h-4 w-4 text-accent-neon animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}