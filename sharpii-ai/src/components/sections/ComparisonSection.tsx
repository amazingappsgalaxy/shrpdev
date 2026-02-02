"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ScanLine,
  ArrowUpRight
} from "lucide-react"
import { IMAGE_ASSETS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ComparisonPair {
  before: string
  after: string
  title: string
  description?: string
  improvement?: string
  category?: string
}

export function ComparisonSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAfter, setShowAfter] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const comparisonSectionRef = useRef<HTMLDivElement>(null)

  // Static values (same as before)
  const staticImprovements = ["94%", "91%", "96%", "89%", "92%", "95%", "93%", "90%", "97%", "88%"]
  const categories = ["Portrait", "Professional", "Lifestyle", "Creative", "Business"]

  const comparisonPairs: ComparisonPair[] = IMAGE_ASSETS.beforeAfterPairs.slice(0, 4).map((pair, index) => ({
    before: pair.before,
    after: pair.after,
    title: pair.title,
    description: "AI-powered enhancement with professional results",
    improvement: staticImprovements[index] || "93%",
    category: categories[index % categories.length]
  }))

  const hasPairs = comparisonPairs.length > 0
  const currentPair = comparisonPairs[currentIndex % comparisonPairs.length]!

  useEffect(() => {
    if (isAutoPlaying && hasPairs) {
      autoPlayRef.current = setInterval(() => {
        handleNext()
      }, 5000)
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isAutoPlaying, hasPairs])

  const handleNext = () => {
    setIsScanning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % comparisonPairs.length)
      setShowAfter(false)
      setIsScanning(false)
    }, 500)
  }

  const handlePrevious = () => {
    setIsScanning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + comparisonPairs.length) % comparisonPairs.length)
      setShowAfter(false)
      setIsScanning(false)
    }, 500)
  }

  const toggleView = () => {
    setIsScanning(true)
    setTimeout(() => {
      setShowAfter(!showAfter)
      setIsScanning(false)
    }, 400) // Scan duration
  }

  if (!hasPairs) return null

  return (
    <section id="comparison-section" className="relative py-32 overflow-hidden bg-black">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-purple/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-24 max-w-4xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-accent-neon mb-6 backdrop-blur-md"
          >
            AI Enhancement Engine
          </motion.span>

          <h2 className="font-heading text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Reality, </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple">Re-imagined.</span>
          </h2>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
            Our neural networks analyze and reconstruct every pixel, delivering professional-grade restoration in seconds.
          </p>
        </div>

        {/* Comparison Stage */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">

          {/* Left Controls / Info */}
          <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-white/40 text-xs font-bold tracking-widest uppercase">Analysis</h3>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Resolution</span>
                <span className="text-accent-neon font-mono">4K Ultra</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Sharpness</span>
                <span className="text-accent-blue font-mono">100%</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Quality</span>
                <span className="text-accent-purple font-mono">+{currentPair.improvement}</span>
              </div>
            </div>

            <div className="flex justify-between gap-4">
              <button onClick={handlePrevious} className="h-12 w-12 rounded-full glass-elevated flex items-center justify-center hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="flex-1 h-12 rounded-full glass-elevated flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                {isAutoPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                <span className="text-sm font-bold text-white uppercase tracking-wide">{isAutoPlaying ? "Pause" : "Auto Cycle"}</span>
              </button>
              <button onClick={handleNext} className="h-12 w-12 rounded-full glass-elevated flex items-center justify-center hover:bg-white/10 transition-colors">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Main Stage */}
          <div ref={comparisonSectionRef} className="lg:col-span-9 order-1 lg:order-2">
            <div className="relative aspect-[4/3] md:aspect-[16/9] rounded-3xl overflow-hidden glass-premium shadow-2xl border border-white/10 group">

              {/* Images */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`image-${currentIndex}-${showAfter}`}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 1 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={showAfter ? currentPair.after : currentPair.before}
                    alt="Comparison"
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Scanning Laser Effect */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ left: "-10%" }}
                    animate={{ left: "110%" }}
                    exit={{ left: "110%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute top-0 bottom-0 w-2 bg-accent-neon/80 z-20 shadow-[0_0_30px_rgba(56,255,255,0.8)] filter blur-[1px]"
                  >
                    <div className="absolute top-0 bottom-0 -left-10 w-20 bg-gradient-to-r from-transparent via-accent-neon/20 to-transparent" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overlay UI */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              {/* Toggle Button (Center) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button
                  onClick={toggleView}
                  className="pointer-events-auto group/btn relative"
                >
                  <div className="absolute inset-0 bg-accent-blue/30 rounded-full blur-xl group-hover/btn:blur-2xl transition-all duration-300" />
                  <div className="w-20 h-20 rounded-full glass-elevated border border-white/20 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover/btn:scale-110">
                    <ScanLine className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-bold text-white uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity">
                    {showAfter ? "Show Original" : "Enhance"}
                  </span>
                </button>
              </div>

              {/* Status Badges */}
              <div className="absolute top-6 left-6 flex gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase">
                  {showAfter ? "Enhanced" : "Original"}
                </div>
                {showAfter && (
                  <div className="px-3 py-1.5 rounded-lg bg-accent-neon/20 backdrop-blur-md border border-accent-neon/30 text-xs font-bold text-accent-neon uppercase flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Optimized
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {comparisonPairs.map((pair, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsScanning(true)
                    setTimeout(() => {
                      setCurrentIndex(idx)
                      setShowAfter(false)
                      setIsScanning(false)
                    }, 400)
                  }}
                  className={cn(
                    "relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-300",
                    currentIndex === idx ? "border-accent-neon shadow-neon" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <Image
                    src={pair.after}
                    alt={pair.title}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}