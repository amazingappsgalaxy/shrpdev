"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion"
import { Sparkles, Scan, Zap, Layers } from "lucide-react"
import Image from "next/image"

export function MagicalPortraitSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse position for scanner
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth spring animation for scanner
  const smoothX = useSpring(mouseX, { damping: 25, stiffness: 150 })
  const smoothY = useSpring(mouseY, { damping: 25, stiffness: 150 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  // Initial center position
  useEffect(() => {
    mouseX.set((containerRef.current?.clientWidth || 0) / 2)
    mouseY.set((containerRef.current?.clientHeight || 0) / 2)
  }, [])

  return (
    <section className="relative py-32 bg-black overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00]/50 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FFFF00]/20 bg-[#FFFF00]/5 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-[#FFFF00] animate-pulse" />
              <span className="text-xs font-bold text-[#FFFF00] uppercase tracking-widest">Real-time Enhancement</span>
            </motion.div>

            <h2 className="font-heading text-5xl md:text-6xl font-black text-white mb-6 leading-none">
              Magic <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFF00] via-white to-[#FFFF00]">
                In Motion.
              </span>
            </h2>

            <p className="text-lg text-white/50 mb-10 leading-relaxed max-w-lg">
              Experience our X-Ray enhancement technology. Move your cursor over the image to reveal 8K details hidden within standard resolution files.
            </p>

            <div className="flex flex-col gap-6">
              {[
                { icon: Scan, title: "Sub-pixel Analysis", desc: "Detects hidden details in milliseconds." },
                { icon: Layers, title: "Layer Reconstruction", desc: "Rebuilds texture from noise." },
                { icon: Zap, title: "Instant Rendering", desc: "Zero-latency preview generation." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-[#FFFF00]/30 transition-colors">
                    <item.icon className="w-6 h-6 text-white group-hover:text-[#FFFF00] transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{item.title}</h4>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Interactive Scanner */}
          <div className="order-1 lg:order-2">
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, rotate: 5 }}
              whileInView={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] w-full max-w-md mx-auto rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl cursor-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                mouseX.set(containerRef.current?.clientWidth! / 2)
                mouseY.set(containerRef.current?.clientHeight! / 2)
              }}
            >
              {/* Base Image (Blurry/Before) */}
              <div className="absolute inset-0">
                <Image
                  src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg"
                  alt="Before"
                  fill
                  className="object-cover opacity-60 grayscale-[50%]"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Scanner Lens - Reveals After Image */}
              <motion.div
                className="absolute w-64 h-64 rounded-full overflow-hidden border-2 border-[#FFFF00] shadow-[0_0_50px_rgba(255,255,0,0.3)] z-20"
                style={{
                  x: smoothX,
                  y: smoothY,
                  translateX: '-50%',
                  translateY: '-50%'
                }}
              >
                {/* High Res Image Inside Lens */}
                <div className="relative w-[30rem] h-[40rem] -ml-28 -mt-36">  {/* Adjust margins relative to lens center */}
                  <motion.div
                    className="w-full h-full relative"
                    style={{
                      x: useTransform(smoothX, [0, 500], [0, -100]), // Parallax effect inside lens
                      y: useTransform(smoothY, [0, 500], [0, -100])
                    }}
                  >
                    <Image
                      src="https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png"
                      alt="After"
                      fill
                      className="object-cover scale-150" /* slight zoom for magnifying glass effect */
                    />
                  </motion.div>
                </div>

                {/* Lens UI Overlays */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFFF00]/10 to-transparent pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-[#FFFF00]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </motion.div>

              {/* Floating Label */}
              <div className="absolute bottom-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-mono text-white/70 border border-white/10 pointer-events-none">
                Hover to Scan
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
