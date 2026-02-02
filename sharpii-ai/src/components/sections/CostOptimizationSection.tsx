"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import {
  DollarSign,
  TrendingDown,
  Zap,
  Calculator,
  PiggyBank,
  Clock,
  Target,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BarChart3,
  Coins,
  Timer,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function CostOptimizationSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [imagesPerMonth, setImagesPerMonth] = useState([100])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
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
      transition: { duration: 0.5, ease: "easeOut" as any }
    }
  }

  const calculateSavings = (images: number) => {
    // Assumptions: Traditional edit $50, Sharpii $0.10 (illustrative)
    const traditionalCost = images * 50
    const sharpiiCost = images * 0.1 // Significant savings
    const annualSavings = (traditionalCost - sharpiiCost) * 12
    return {
      monthly: traditionalCost - sharpiiCost,
      annual: annualSavings,
      efficiency: "99.8%"
    }
  }

  const savings = calculateSavings(imagesPerMonth[0]!)

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-gradient-to-b from-accent-purple/5 to-transparent opacity-50" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-20"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-elevated border border-white/10 mb-8">
            <Coins className="h-4 w-4 text-accent-neon" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Smart Cost Optimization</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="font-heading text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Save Up To</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-neon via-emerald-400 to-teal-400">
              85%
            </span>
            <br />
            <span className="text-white">On Processing</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            Our revolutionary AI processing architecture dramatically reduces computational costs without compromising on quality.
          </motion.p>
        </motion.div>

        {/* Dashboard Interface */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid lg:grid-cols-12 gap-8 mb-24"
        >
          {/* Control Panel */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] glass-card-elevated border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Cost Simulator</h3>
                  <p className="text-white/60">Adjust projection volume</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <Calculator className="w-6 h-6 text-accent-neon" />
                </div>
              </div>

              {/* Slider Section */}
              <div className="mb-12">
                <div className="flex justify-between text-sm font-medium text-white/80 mb-6">
                  <span>100 Images</span>
                  <span className="text-accent-neon">{imagesPerMonth[0]} Images / month</span>
                  <span>10,000 Images</span>
                </div>
                <Slider
                  defaultValue={[100]}
                  max={10000}
                  min={100}
                  step={100}
                  value={imagesPerMonth}
                  onValueChange={setImagesPerMonth}
                  className="py-4"
                />
              </div>

              {/* Comparison Bars */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-white">Traditional Retouching</span>
                    <span className="text-red-400">${(imagesPerMonth[0]! * 50).toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-600"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-white">Other AI Tools</span>
                    <span className="text-yellow-400">${(imagesPerMonth[0]! * 5).toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: "30%" }} // Approximate ratio
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-white flex items-center gap-2">Sharpii.ai <span className="px-2 py-0.5 rounded text-[10px] bg-accent-neon text-black font-bold">BEST VALUE</span></span>
                    <span className="text-accent-neon">${(imagesPerMonth[0]! * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full bg-accent-neon"
                      initial={{ width: 0 }}
                      animate={{ width: "5%" }} // Very small relative to traditional
                      transition={{ duration: 1 }}
                    />
                    <div className="absolute inset-0 bg-accent-neon/20 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Savings Display */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] bg-gradient-to-br from-accent-neon/20 to-accent-blue/20 border border-accent-neon/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent-neon/10 blur-[50px] group-hover:bg-accent-neon/20 transition-colors duration-700" />

              <div className="relative z-10">
                <h3 className="text-white/80 font-medium mb-1">Estimated Annual Savings</h3>
                <div className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                  ${savings.annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>

                <div className="flex items-center gap-3 text-sm text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-xl w-fit border border-emerald-500/20">
                  <TrendingDown className="w-4 h-4" />
                  <span>Redirect funds to growth</span>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="p-6 rounded-[2rem] glass-card border border-white/5">
                <Clock className="w-8 h-8 text-accent-blue mb-4" />
                <div className="text-2xl font-bold text-white mb-1">300x</div>
                <div className="text-white/60 text-sm">Faster Delivery</div>
              </motion.div>

              <motion.div variants={itemVariants} className="p-6 rounded-[2rem] glass-card border border-white/5">
                <BarChart3 className="w-8 h-8 text-accent-purple mb-4" />
                <div className="text-2xl font-bold text-white mb-1">ROI</div>
                <div className="text-white/60 text-sm">Positive in 1 week</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Features List */}
        <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Batch Processing",
              desc: "Process thousands of images simultaneously with our distributed cloud architecture."
            },
            {
              icon: <Target className="w-6 h-6" />,
              title: "Precision Targeting",
              desc: "Pay only for what you enhance. Our AI detects exactly what needs improvement."
            },
            {
              icon: <CheckCircle className="w-6 h-6" />,
              title: "Quality Guarantee",
              desc: "Automatic quality assurance checks on every processed image."
            }
          ].map((feature, i) => (
            <motion.div key={i} variants={itemVariants} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-white">
                {feature.icon}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}