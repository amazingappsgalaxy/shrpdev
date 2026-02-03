"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Maximize2
} from "lucide-react"

interface MyPopupViewProps {
  isOpen: boolean
  onClose: () => void
  beforeImage: string
  afterImage: string
  title: string
  description: string
}

export default function MyPopupView({
  isOpen,
  onClose,
  beforeImage,
  afterImage,
  title,
  description
}: MyPopupViewProps) {
  // We use Refs for direct DOM manipulation to avoid React Render Cycle lag
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const afterImageRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)

  // Minimal state for view management
  const [isMounted, setIsMounted] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Mount handling for Portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Lock Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isOpen])

  // Optimization: Direct DOM update function
  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current || !sliderRef.current || !afterImageRef.current || !handleRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percent = (x / rect.width) * 100

    // Direct style updates - ZERO React renders
    sliderRef.current.style.left = `${percent}%`
    afterImageRef.current.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`
    // handleRef.current.style.left = `${percent}%` // Handle moves with slider div
  }, [])

  // Mouse/Touch Event Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const startDrag = (clientX: number) => {
      updateSliderPosition(clientX)

      const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
        let cx;
        // Check if it's a touch event by presence of touches
        if ('touches' in moveEvent && moveEvent.touches && moveEvent.touches.length > 0) {
          cx = moveEvent.touches[0]?.clientX ?? 0;
        } else {
          // It's a mouse event
          cx = (moveEvent as MouseEvent).clientX;
        }
        requestAnimationFrame(() => updateSliderPosition(cx))
      }

      const upHandler = () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('touchmove', moveHandler)
        window.removeEventListener('mouseup', upHandler)
        window.removeEventListener('touchend', upHandler)
      }

      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('touchmove', moveHandler, { passive: false })
      window.addEventListener('mouseup', upHandler)
      window.addEventListener('touchend', upHandler)
    }

    let cx;
    if ('touches' in e && e.touches && e.touches.length > 0) {
      cx = e.touches[0]?.clientX ?? 0;
    } else {
      cx = (e as React.MouseEvent).clientX;
    }
    startDrag(cx)
  }, [updateSliderPosition])


  if (!isOpen || !isMounted) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-6xl h-[85vh] mx-4 bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image Area - 100% Lag Free Logic */}
          <div
            className="flex-1 relative overflow-hidden bg-black select-none cursor-ew-resize group"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {/* Background Image (BEFORE - Now visible on the RIGHT side as slider moves left? No.) 
               Let's re-think standard logic:
               - We want "Before" on Left, "After" on Right. 
               - If we clip the TOP image from 0 to X%, the Left side is the TOP image.
               - So TOP image = BEFORE. 
               - BOTTOM image = AFTER.
               
               User said: "you have put before image as after enhanced image".
               So currently: Bottom=After, Top=Before.
               If user thinks this is reversed, they probably see the "Enhanced" version on the Left?
               Wait, "Before" image is usually "Original" (Bad Quality). "After" is "Enhanced" (Good Quality).
               
               If I want to fix "reversed logic", I should swap them.
               So Bottom = Before. Top = After.
               Then Left Side (Top) = After. Right Side (Bottom) = Before.
               This logic (After on Left) is often used to "Reveal" the enhancement.
               
               Let's swap them as requested.
            */}

            {/* Background Image (now BEFORE/Original) */}
            <img
              src={beforeImage}
              alt="Before"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {/* Labels */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-bold text-white/70 border border-white/10 pointer-events-none">
              Before
            </div>

            {/* Foreground Image (now AFTER/Enhanced - Clipped) */}
            <div
              ref={afterImageRef}
              className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              }}
            >
              <img
                src={afterImage}
                alt="After"
                className="absolute inset-0 w-full h-full object-contain max-w-none"
                style={{ width: '100%', height: '100%', transform: `scale(${zoomLevel})` }}
              />
              <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-[#FFFF00]/10 backdrop-blur-md rounded-full text-xs font-bold text-[#FFFF00] border border-[#FFFF00]/20">
                After
              </div>
            </div>

            {/* Slider Handle (Absolute) - Simple Yellow Line with Diamond/Icon */}
            <div
              ref={sliderRef}
              className="absolute top-0 bottom-0 w-[2px] bg-[#FFFF00] z-30 pointer-events-none shadow-[0_0_10px_rgba(255,255,0,0.5)]"
              style={{ left: '50%' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                {/* Simple Geometric Handle */}
                <div className="w-6 h-6 rotate-45 border-2 border-[#FFFF00] bg-black shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#FFFF00] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar removed - simplified to bottom controls if needed, or just cleaner UI */}
          {/* User asked to "remove the stats button". */}
          {/* We'll stick to a minimal bottom bar or overlay? 
              Actually the sidebar contained title/desc. We should probably keep title/desc but remove "buttons".
              Let's make it a bottom overlay or simpler side panel.
          */}
          <div className="w-full md:w-80 bg-black/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col z-40">
            <h3 className="text-xl font-bold font-heading text-white mb-2">{title}</h3>
            <p className="text-white/60 leading-relaxed text-sm mb-6 flex-1">
              {description}
            </p>

            {/* Simplified Controls - Just Zoom */}
            <div className="flex gap-4 mt-auto">
              <button
                onClick={() => setZoomLevel(z => Math.min(z + 0.5, 3))}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-white text-sm font-bold"
              >
                <ZoomIn className="w-4 h-4" /> Zoom
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-white text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}