"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, Play, Zap, Clock, Target, CheckCircle2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WorkflowSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" as any }
    }
  }

  const steps = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Analyze",
      description: "AI scans image for imperfections utilizing neural networks",
      color: "text-accent-blue",
      bg: "bg-accent-blue/10",
      border: "border-accent-blue/20"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Enhance",
      description: "Smart algorithms process and upscale in real-time",
      color: "text-accent-neon",
      bg: "bg-accent-neon/10",
      border: "border-accent-neon/20"
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: "Deliver",
      description: "Download professional results instantly in high quality",
      color: "text-accent-purple",
      bg: "bg-accent-purple/10",
      border: "border-accent-purple/20"
    }
  ]

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-r from-accent-blue/5 via-accent-neon/5 to-accent-purple/5 blur-[100px] rounded-full opacity-50" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10" ref={ref}>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-20"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8">
            <Clock className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Seamless Workflow</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-4xl md:text-6xl font-bold mb-6">
            <span className="text-white">From Upload to</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon to-accent-blue">
              Perfection in Seconds
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl text-white/60 max-w-2xl mx-auto">
            Our streamlined process ensures you get studio-quality results without the wait.
          </motion.p>
        </motion.div>


        {/* Steps Grid with Connecting Lines */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative grid md:grid-cols-3 gap-8 mb-24 max-w-5xl mx-auto"
        >
          {/* Decorative Connecting Line (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 hidden md:block" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative glass-card-elevated rounded-3xl p-8 border ${step.border} group backdrop-blur-xl hover:-translate-y-2 transition-transform duration-500`}
            >
              {/* Step Number Badge */}
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${step.bg} ${step.border} border flex items-center justify-center text-xs font-bold text-white z-20`}>
                {index + 1}
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <div className={step.color}>{step.icon}</div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-accent-neon via-accent-blue to-accent-purple">
            <Button
              className="rounded-full bg-black hover:bg-white/10 text-white px-10 py-8 text-lg font-bold border-none transition-all duration-300 h-auto"
            >
              <span className="mr-2">Start Enhancing Free</span>
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
          <p className="mt-4 text-white/40 text-sm">No credit card required for trial</p>
        </motion.div>

      </div>
    </section>
  )
}