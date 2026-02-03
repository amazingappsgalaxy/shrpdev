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
        if ('touches' in moveEvent && moveEvent.touches.length > 0) {
          cx = moveEvent.touches[0].clientX;
        } else {
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
    if ('touches' in e && e.touches.length > 0) {
      cx = e.touches[0].clientX;
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
            {/* Before Image (Background) */}
            <img
              src={beforeImage}
              alt="Before"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {/* Labels */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-bold text-white/50 border border-white/10 pointer-events-none">
              Before
            </div>

            {/* After Image (Foreground - Clipped) */}
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

            {/* Slider Handle (Absolute) */}
            <div
              ref={sliderRef}
              className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none"
              style={{ left: '50%' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-full flex items-center justify-center transform transition-transform group-hover:scale-110">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L8 12L15 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 12H9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sidebar / Info Panel */}
          <div className="w-full md:w-80 bg-black/40 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 p-8 flex flex-col z-40">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-[#FFFF00]" />
              <span className="text-xs font-bold text-[#FFFF00] uppercase tracking-widest">Enhanced Details</span>
            </div>

            <h3 className="text-2xl font-bold font-heading text-white mb-4">{title}</h3>
            <p className="text-white/60 leading-relaxed text-sm mb-8 flex-1">
              {description}
            </p>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <button
                onClick={() => setZoomLevel(z => Math.min(z + 0.5, 3))}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-white text-sm font-bold"
              >
                <ZoomIn className="w-4 h-4" /> Zoom In
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-white text-sm font-bold"
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