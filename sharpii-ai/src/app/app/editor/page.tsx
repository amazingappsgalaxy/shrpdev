"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  Download,
  X,
  Maximize2,
  DollarSign,
  Play,
  Crop,
  HelpCircle,
  RotateCcw,
  ArrowDown,
  TrendingUp,
  Eye,
  Expand,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import UserHeader from "@/components/app/UserHeader"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import MyPopupView from "@/components/ui/my-popup-view"
import { ModelPricingEngine } from "@/lib/model-pricing-config"

interface AreaProtectionSettings {
  face: {
    skin: boolean
    mouth: boolean
    lowerLip: boolean
    upperLip: boolean
    nose: boolean
  }
  eyes: {
    eyeGeneral: boolean
    rightEye: boolean
    leftBrow: boolean
    rightBrow: boolean
    leftEye: boolean
  }
}

const DEFAULT_AREA_PROTECTION: AreaProtectionSettings = {
  face: {
    skin: false,
    mouth: true,
    lowerLip: true,
    upperLip: true,
    nose: false
  },
  eyes: {
    eyeGeneral: false,
    rightEye: true,
    leftBrow: true,
    rightBrow: false,
    leftEye: true
  }
}

// Available models configuration - based on actual API
const AVAILABLE_MODELS = [
  {
    id: 'runninghub-flux-upscaling',
    name: 'FLUX Upscaling Model',
    provider: 'runninghub',
    category: 'Professional',
    description: 'Advanced FLUX model with ComfyUI workflow',
    icon: '⚡'
  },
  {
    id: 'fermatresearch/magic-image-refiner',
    name: 'Magic Image Refiner',
    provider: 'replicate',
    category: 'Standard',
    description: 'Refines image quality and details',
    icon: '✨'
  }
]

// Model-specific control configurations
const MODEL_CONTROLS = {
  'runninghub-flux-upscaling': {
    prompt: { type: 'text', default: 'high quality, detailed, enhanced', label: 'Prompt' },
    steps: { type: 'number', default: 10, min: 5, max: 50, label: 'Processing Steps' },
    guidance_scale: { type: 'number', default: 3.5, min: 1, max: 20, step: 0.1, label: 'Guidance Scale' },
    strength: { type: 'number', default: 0.3, min: 0.1, max: 1, step: 0.1, label: 'Denoise Strength' },
    scheduler: { type: 'select', default: 'sgm_uniform', options: ['simple', 'sgm_uniform', 'karras', 'exponential', 'ddim_uniform', 'beta', 'normal', 'ays', 'ays+'], label: 'Scheduler' },
    enable_upscale: { type: 'boolean', default: true, label: 'Enable Upscaling' },
    upscaler: { type: 'select', default: '4xRealWebPhoto_v4_dat2.pth', options: ['4xRealWebPhoto_v4_dat2.pth', '4x_NMKD-Siax_200k.pth', '4x-UltraSharp.pth', 'RealESRGAN_x4plus.pth'], label: 'Upscaler Model' },
    sampler_name: { type: 'select', default: 'dpmpp_2m', options: ['dpmpp_2m', 'euler', 'euler_ancestral', 'heun', 'dpm_2', 'dpm_2_ancestral', 'lms', 'dpmpp_sde', 'dpmpp_2s_ancestral'], label: 'Sampling Method' },
    seed: { type: 'number', default: 0, min: 0, max: 999999999, label: 'Seed (0 for random)' }
  },
  'fermatresearch/magic-image-refiner': {
    creativity: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.1, label: 'Creativity Level' },
    hdr: { type: 'boolean', default: false, label: 'HDR Enhancement' },
    resemblance: { type: 'number', default: 0.8, min: 0, max: 1, step: 0.1, label: 'Resemblance to Original' }
  }
}

// iOS-style Task Loader Component
function MyTaskLoader({ isVisible, progress, status, message }: {
  isVisible: boolean
  progress: number
  status: 'loading' | 'success' | 'error'
  message: string
}) {
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const [displayProgress, setDisplayProgress] = useState(0)

  // Simulate progress when loading starts
  useEffect(() => {
    if (status === 'loading' && isVisible) {
      setSimulatedProgress(0)
      const interval = setInterval(() => {
        setSimulatedProgress(prev => {
          // Slow down as we approach 90%
          const increment = prev < 30 ? 2 : prev < 60 ? 1 : prev < 85 ? 0.5 : 0.1
          const newProgress = Math.min(prev + increment, 90)
          return newProgress
        })
      }, 200)

      return () => clearInterval(interval)
    } else if (status === 'success') {
      setSimulatedProgress(100)
    }

    return () => { } // Ensure all code paths return a cleanup function
  }, [status, isVisible])

  // Use API progress if available and > simulated, otherwise use simulated
  useEffect(() => {
    const finalProgress = Math.max(progress, simulatedProgress)
    setDisplayProgress(finalProgress)
  }, [progress, simulatedProgress])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[9999]"
      >
        <motion.div
          layout
          className={cn(
            "backdrop-blur-2xl border shadow-2xl flex items-center gap-4 transition-all decoration-[#FFFF00]",
            status === 'loading' && "bg-black/80 border-white/30 rounded-full px-6 py-4 min-w-[360px]",
            status === 'success' && "bg-green-900/80 border-green-400/50 rounded-2xl px-8 py-6 min-w-[300px]",
            status === 'error' && "bg-red-900/80 border-red-400/50 rounded-2xl px-8 py-6 min-w-[300px]"
          )}
        >
          {/* Icon/Progress Indicator */}
          <div className="relative flex-shrink-0">
            {status === 'loading' && (
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-3 border-white/20" />
                <svg className="absolute inset-0 w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="url(#websiteGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - displayProgress / 100)}`}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="websiteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(199, 100%, 50%)" />
                      <stop offset="100%" stopColor="hsl(258, 90%, 66%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{Math.round(displayProgress)}</span>
                </div>
              </div>
            )}
            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <AlertCircle className="w-10 h-10 text-red-400" />
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className={cn(
                "font-semibold block truncate",
                status === 'loading' && "text-white text-sm",
                status === 'success' && "text-green-100 text-base",
                status === 'error' && "text-red-100 text-base"
              )}>
                {status === 'loading' && 'Enhancing Image...'}
                {status === 'success' && 'Enhancement Complete!'}
                {status === 'error' && 'Enhancement Failed'}
              </span>
              <span className={cn(
                "text-xs mt-1 block truncate",
                status === 'loading' && "text-gray-300",
                status === 'success' && "text-green-200",
                status === 'error' && "text-red-200"
              )}>
                {status === 'loading' && `${Math.round(displayProgress)}% complete`}
                {status === 'success' && 'Your enhanced image is ready'}
                {status === 'error' && (message || 'Please try again')}
              </span>
            </motion.div>
          </div>

          {/* Additional Elements */}
          {status === 'loading' && (
            <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden flex-shrink-0">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(135deg, hsl(199, 100%, 50%), hsl(258, 90%, 66%))'
                }}
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-green-400"
            >
              <TrendingUp className="w-6 h-6" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Image Comparison Slider Component
function ImageComparisonSlider({
  originalImage,
  enhancedImage,
  onExpand,
  onDownload
}: {
  originalImage: string
  enhancedImage: string
  onExpand?: () => void
  onDownload?: () => void
}) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPosition(percentage)
  }, [isDragging])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPosition(percentage)
  }, [isDragging])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPosition(percentage)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-pointer select-none overflow-hidden rounded-2xl"
        onClick={handleClick}
      >
        {/* Original Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={originalImage}
            alt="Original"
            className="w-full h-full object-contain"
            draggable={false}
          />
          <div className="absolute top-4 left-4">
            <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
              Original
            </div>
          </div>
        </div>

        {/* Enhanced Image (Overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `polygon(${sliderPosition}% 0%, 100% 0%, 100% 100%, ${sliderPosition}% 100%)` }}
        >
          <img
            src={enhancedImage}
            alt="Enhanced"
            className="w-full h-full object-contain"
            draggable={false}
          />
          <div className="absolute top-4 right-4">
            <div className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 text-white text-xs px-3 py-1.5 rounded-full border border-green-400/30 backdrop-blur-sm">
              ✨ Enhanced
            </div>
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-col-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Handle Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-col-resize border-4 border-black/20">
              <div className="flex items-center gap-1">
                <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/60 pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-2 rounded-full transition-colors bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
            title="Expand view"
          >
            <Expand className="w-4 h-4" />
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 rounded-full transition-colors bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
            title="Download enhanced image"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
          {Math.round(sliderPosition)}% Enhanced View
        </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  const { user, isLoading } = useAuth()

  // Core state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
  const [enhancementType, setEnhancementType] = useState<'face' | 'body'>('face')
  const [enhancementMode, setEnhancementMode] = useState<'standard' | 'detailed' | 'heavy'>('standard')
  const [skinTextureAdjuster, setSkinTextureAdjuster] = useState(0.37)
  const [skinReductionLevel, setSkinReductionLevel] = useState(1.7)
  const [imageSize, setImageSize] = useState({ width: 960, height: 1280 })
  const [areaProtection, setAreaProtection] = useState<AreaProtectionSettings>(DEFAULT_AREA_PROTECTION)

  // New model and enhancement state
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementProgress, setEnhancementProgress] = useState(0)
  const [enhancementStatus, setEnhancementStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [enhancementMessage, setEnhancementMessage] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [estimatedCredits, setEstimatedCredits] = useState(0)

  // Model settings - start with defaults for first model
  const [modelSettings, setModelSettings] = useState<Record<string, any>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (files: FileList) => {
    const file = files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height })
        }
        img.src = e.target?.result as string
        setUploadedImage(e.target?.result as string)
        setEnhancedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  // Calculate estimated credits whenever settings change
  const updateEstimatedCredits = useCallback(() => {
    try {
      const result = ModelPricingEngine.calculateCredits(
        imageSize.width,
        imageSize.height,
        selectedModel,
        {
          ...modelSettings,
          enable_upscale: modelSettings.enable_upscale,
          steps: modelSettings.steps,
          guidance_scale: modelSettings.guidance_scale,
          denoise: modelSettings.strength || modelSettings.denoise,
          scheduler: modelSettings.scheduler,
          sampler_name: modelSettings.sampler_name,
          upscale_model: modelSettings.upscaler
        }
      )
      setEstimatedCredits(result.totalCredits)
    } catch (error) {
      console.warn('Failed to calculate credits:', error)
      setEstimatedCredits(100) // fallback
    }
  }, [imageSize, selectedModel, modelSettings])

  useEffect(() => {
    updateEstimatedCredits()
  }, [updateEstimatedCredits])

  // Reset model settings when model changes
  useEffect(() => {
    const controls = MODEL_CONTROLS[selectedModel as keyof typeof MODEL_CONTROLS]
    if (controls) {
      const newSettings = {}
      Object.entries(controls).forEach(([key, config]) => {
        newSettings[key] = config.default
      })
      setModelSettings(prev => ({ ...prev, ...newSettings }))
    }
  }, [selectedModel])

  const handleEnhancement = async () => {
    if (!uploadedImage || !user) return

    setIsEnhancing(true)
    setEnhancementProgress(0)
    setEnhancementStatus('loading')
    setEnhancementMessage('Initializing enhancement...')

    try {
      // Prepare enhancement request with model-specific settings
      const enhancementSettings = {
        imageWidth: imageSize.width,
        imageHeight: imageSize.height,
        enhancementType,
        enhancementMode,
        skinTextureAdjuster,
        skinReductionLevel,
        ...modelSettings
      }

      // Add area protection for RunningHub models
      if (selectedModel === 'runninghub-flux-upscaling') {
        enhancementSettings.areaProtection = areaProtection
      }

      const enhancementData = {
        imageUrl: uploadedImage,
        settings: enhancementSettings,
        modelId: selectedModel,
        userId: user.id,
        imageId: `img-${Date.now()}`
      }

      // Start enhancement
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enhancementData)
      })

      const result = await response.json()

      console.log('API Response:', result)

      if (!response.ok) {
        throw new Error(result.error || result.message || `API Error: ${response.status}`)
      }

      if (result.success && result.enhancedUrl) {
        setEnhancedImage(result.enhancedUrl)
        setEnhancementStatus('success')
        setEnhancementMessage('Enhancement completed successfully!')
        setEnhancementProgress(100)

        // Hide success message after 3 seconds
        setTimeout(() => {
          setIsEnhancing(false)
        }, 3000)
      } else if (result.enhancedUrl) {
        // Handle case where API returns enhancedUrl without explicit success flag
        setEnhancedImage(result.enhancedUrl)
        setEnhancementStatus('success')
        setEnhancementMessage('Enhancement completed successfully!')
        setEnhancementProgress(100)

        setTimeout(() => {
          setIsEnhancing(false)
        }, 3000)
      } else {
        throw new Error(result.error || result.message || 'Enhancement failed - no enhanced image returned')
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
      setEnhancementStatus('error')
      setEnhancementMessage(error instanceof Error ? error.message : 'Enhancement failed')

      // Hide error message after 5 seconds
      setTimeout(() => {
        setIsEnhancing(false)
      }, 5000)
    }
  }

  const updateAreaProtection = (category: 'face' | 'eyes', key: string, value: boolean) => {
    setAreaProtection(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  // Helper function to render model-specific controls
  const renderModelControls = () => {
    const controls = MODEL_CONTROLS[selectedModel as keyof typeof MODEL_CONTROLS]
    if (!controls) return null

    return Object.entries(controls).map(([key, config]) => {
      const currentValue = modelSettings[key] || config.default

      switch (config.type) {
        case 'text':
          return (
            <div key={key}>
              <label className="text-xs font-light text-gray-300 mb-1 block">{config.label}</label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setModelSettings(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={config.default}
                className="w-full px-2 py-1 text-xs bg-[#151515] border border-[#282828] rounded text-gray-300 focus:border-[#FFFF00] focus:outline-none"
              />
            </div>
          )

        case 'number':
          return (
            <div key={key}>
              <label className="text-xs font-light text-gray-300 flex justify-between">
                <span>{config.label}</span>
                <span className="text-gray-400">{currentValue}</span>
              </label>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step || 1}
                value={currentValue}
                onChange={(e) => setModelSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
              />
              {config.min !== undefined && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{config.label.includes('Steps') ? `Fast (${config.min})` : config.label.includes('Scale') ? `Flexible (${config.min})` : `Min (${config.min})`}</span>
                  <span>{config.label.includes('Steps') ? `Quality (${config.max})` : config.label.includes('Scale') ? `Strict (${config.max})` : `Max (${config.max})`}</span>
                </div>
              )}
            </div>
          )

        case 'boolean':
          return (
            <div key={key}>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-light text-gray-300">{config.label}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={currentValue}
                    onChange={(e) => setModelSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <div className={cn(
                    "w-10 h-5 rounded-full transition-all duration-300 flex items-center",
                    currentValue
                      ? "bg-[#FFFF00] shadow-sm shadow-blue-500/20"
                      : "bg-gradient-to-r from-[#1c1c1e] to-[#1c1c1e]/80"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                      currentValue
                        ? "bg-white translate-x-[22px]"
                        : "bg-gray-400 translate-x-[2px]"
                    )} />
                  </div>
                </div>
              </label>
            </div>
          )

        case 'select':
          return (
            <div key={key}>
              <label className="text-xs font-light text-gray-300 mb-1 block">{config.label}</label>
              <select
                value={currentValue}
                onChange={(e) => setModelSettings(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-2 py-1 text-xs bg-[#151515] border border-[#282828] rounded text-gray-300 focus:border-[#FFFF00] focus:outline-none"
              >
                {config.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )

        default:
          return null
      }
    })
  }

  if (isLoading) {
    return <ElegantLoading message="Loading editor..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" data-testid="editor-page">
      <UserHeader />

      <div className="max-w-7xl mx-auto relative pt-24 px-4 sm:px-6 lg:px-8">

        <div className="h-full flex flex-col lg:grid lg:grid-cols-[1fr_2fr] gap-4">
          {/* Left Sidebar - Input Controls */}
          <div className="h-fit lg:pr-1 w-full">
            <div className="w-full flex-shrink-0 space-y-2 md:space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-light tracking-wide text-white">Input Image</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button className="transition-colors duration-200 flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 bg-[#1c1c1e] text-white hover:bg-[#282828]">
                    <HelpCircle className="w-3 h-3" />
                    Help
                  </button>
                  <button className="transition-colors duration-200 flex items-center gap-1.5 text-xs rounded-full px-2 py-1 text-gray-400 hover:text-white hover:bg-[#1c1c1e]">
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="rounded-xl md:rounded-2xl border border-[#1c1c1e] bg-[#0a0a0a] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div className="space-y-2 md:space-y-3 px-3 md:px-6 py-3">
                  <div className="space-y-4">
                    {/* Image Upload Section */}
                    <div className="flex items-center justify-center">
                      <input
                        type="file"
                        id="image-upload-input"
                        className="hidden"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      />
                      {!uploadedImage ? (
                        <div
                          className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden relative group cursor-pointer border border-[#282828] flex items-center justify-center"
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="text-center">
                            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                            <p className="text-sm font-medium text-gray-300">Upload Image</p>
                            <p className="text-xs text-gray-500 mt-1">Click or drag to upload</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden relative group border border-[#282828]">
                          <img
                            src={uploadedImage}
                            alt="Input"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                                title="Replace image"
                              >
                                <Upload className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setUploadedImage(null)
                                  setEnhancedImage(null)
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = ''
                                  }
                                }}
                                className="p-2 rounded-full bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-500 transition-colors"
                                title="Delete image"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controls Section */}
                    <div className="space-y-3">
                      {/* Model Selection - iOS Style Segmented Control */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[hsl(199,100%,50%)] to-[hsl(258,90%,66%)] flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          AI Enhancement Model
                        </h3>

                        {/* iOS-style Segmented Control */}
                        <div className="relative bg-[#1c1c1e] rounded-xl p-1">
                          <div className="grid grid-cols-2 gap-0 relative">
                            {/* Sliding Background */}
                            <div
                              className="absolute top-1 bottom-1 bg-gradient-to-r from-[hsl(199,100%,50%)] to-[hsl(258,90%,66%)] rounded-lg transition-all duration-300 ease-out"
                              style={{
                                left: selectedModel === AVAILABLE_MODELS[0].id ? '4px' : '50%',
                                right: selectedModel === AVAILABLE_MODELS[0].id ? '50%' : '4px',
                              }}
                            />

                            {AVAILABLE_MODELS.map((model, index) => (
                              <button
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                className={cn(
                                  "relative z-10 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
                                  selectedModel === model.id
                                    ? "text-white"
                                    : "text-gray-400 hover:text-gray-300"
                                )}
                              >
                                <span className="text-lg">{model.icon}</span>
                                <div className="text-left">
                                  <div className="font-semibold text-xs">{model.name.split(' ')[0]}</div>
                                  <div className="text-xs opacity-80">{model.category}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selected Model Description */}
                        <div className="mt-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#1c1c1e]">
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.description}
                          </p>
                        </div>
                      </div>

                      {/* Enhancement Type */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-2">Enhancement Type</h3>
                        <div className="space-y-1">
                          <button
                            onClick={() => setEnhancementType('face')}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                              enhancementType === 'face'
                                ? "bg-[#FFFF00] text-black font-bold shadow-[0_0_20px_rgba(255,255,0,0.3)]"
                                : "bg-[#151515] text-gray-400 hover:text-white border border-[#282828] hover:border-[#FFFF00]/50 hover:bg-[#1c1c1e]"
                            )}
                          >
                            Face
                          </button>
                          <button
                            onClick={() => setEnhancementType('body')}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                              enhancementType === 'body'
                                ? "bg-[#FFFF00] text-black font-bold shadow-[0_0_20px_rgba(255,255,0,0.3)]"
                                : "bg-[#151515] text-gray-400 hover:text-white border border-[#282828] hover:border-[#FFFF00]/50 hover:bg-[#1c1c1e]"
                            )}
                          >
                            Body
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="space-y-1.5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs md:text-sm font-medium mt-3 text-gray-300">Select Enhancement Mode</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                        {['standard', 'detailed', 'heavy'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setEnhancementMode(mode as typeof enhancementMode)}
                            className={cn(
                              "px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-normal transition-all duration-200 relative capitalize",
                              enhancementMode === mode
                                ? "bg-[#FFFF00] text-black font-bold shadow-[0_0_20px_rgba(255,255,0,0.3)]"
                                : "bg-[#151515] text-gray-400 hover:text-white border border-[#282828] hover:border-[#404040]",
                              mode === 'heavy' && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={mode === 'heavy'}
                          >
                            {mode}
                            {mode === 'detailed' && <div className="absolute top-0 right-0 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-full border-t border-[#1c1c1e]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-light text-gray-300">Skin Texture Adjuster</label>
                        <span className="text-sm font-light text-gray-400">{skinTextureAdjuster.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="0.5"
                        step="0.01"
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
                        value={skinTextureAdjuster}
                        onChange={(e) => setSkinTextureAdjuster(Number(e.target.value))}
                      />
                      <div className="flex justify-between">
                        <span className="text-xs font-light text-gray-500">Smooth</span>
                        <span className="text-xs font-light text-gray-500">Detailed</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-light text-gray-300">Skin Realism Level</label>
                        <span className="text-sm font-light text-gray-400">{skinReductionLevel.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
                        value={skinReductionLevel}
                        onChange={(e) => setSkinReductionLevel(Number(e.target.value))}
                      />
                      <div className="flex justify-between">
                        <span className="text-xs font-light text-gray-500">Stylized</span>
                        <span className="text-xs font-light text-gray-500">Realistic</span>
                      </div>
                    </div>

                    {/* Advanced Model Settings */}
                    <div className="border-t border-[#1c1c1e] pt-3">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center justify-between">
                          <span>Advanced Model Settings</span>
                          <div className="transform group-open:rotate-180 transition-transform">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>

                        <div className="mt-3 space-y-3 pl-2">
                          {renderModelControls()}
                        </div>
                      </details>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between px-0.5">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" style={{ color: 'hsl(199, 100%, 50%)' }} />
                          <span className="text-xs font-medium text-gray-200">Cost: <span style={{ color: 'hsl(199, 100%, 50%)' }} className="font-bold">{estimatedCredits}</span> Credits</span>
                        </div>
                        <div className="text-[10px] font-medium text-gray-400">{imageSize.width} × {imageSize.height} px</div>
                      </div>


                      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                        <button
                          onClick={handleEnhancement}
                          disabled={!uploadedImage || isEnhancing}
                          className="group relative w-full px-8 py-4 text-lg font-bold rounded-2xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, hsl(199, 100%, 50%) 0%, hsl(258, 90%, 66%) 100%)',
                            boxShadow: '0 8px 32px hsl(199, 100%, 50%)/0.3, 0 0 0 1px hsl(199, 100%, 50%)/0.2'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center justify-center gap-3">
                            {isEnhancing ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Enhancing...
                              </>
                            ) : (
                              <>
                                Enhance
                              </>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <p className="text-xs text-center font-medium text-gray-400">
                <strong>Use smaller images (512px) for testing. Higher resolution images consume more credits.</strong>
              </p>

              <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0a]">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <button className="text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white">Best Practices</button>
                    <button className="text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white">Pricing</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Area - Result */}
          <div className="h-fit lg:pl-2 w-full">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#1c1c1e] bg-[#0a0a0a] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div className="px-5 pt-3 pb-3 border-b border-[#1c1c1e]">
                  <h3 className="text-lg font-normal tracking-wide text-white">Result</h3>
                </div>

                <div className="px-5 pt-4 pb-3">
                  <div className="flex flex-col gap-2">
                    <div className="relative h-[450px]">
                      <div className="h-full rounded-2xl flex items-center justify-center relative overflow-hidden bg-[#151515] border border-[#282828]">
                        {!uploadedImage ? (
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-900/50 flex items-center justify-center">
                              <Upload className="w-6 h-6 text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-500">Upload an image to get started</p>
                          </div>
                        ) : !enhancedImage ? (
                          <div className="text-center">
                            <img src={uploadedImage} alt="Original" className="max-w-full max-h-full object-contain" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <p className="text-sm text-gray-300">Click "Enhance" to process your image</p>
                            </div>
                          </div>
                        ) : (
                          <ImageComparisonSlider
                            originalImage={uploadedImage}
                            enhancedImage={enhancedImage}
                            onExpand={() => setShowPopup(true)}
                            onDownload={() => {
                              const link = document.createElement('a')
                              link.href = enhancedImage
                              link.download = `enhanced-image-${Date.now()}.jpg`
                              link.click()
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 lg:py-2.5 px-3 text-sm font-medium transition-all duration-200 flex flex-col lg:flex-row items-center justify-center gap-1.5 rounded-lg bg-[#151515] hover:bg-[#1c1c1e] text-gray-300 hover:text-white border border-[#282828] hover:border-[#FFFF00]/50">
                        <TrendingUp className="w-4 h-4" />
                        <div className="text-center">
                          <div className="text-xs font-medium">Upscale Image</div>
                          <div className="text-xs text-gray-500">General upscaling</div>
                        </div>
                      </button>
                      <button className="flex-1 py-2 lg:py-2.5 px-3 text-sm font-medium transition-all duration-200 flex flex-col lg:flex-row items-center justify-center gap-1.5 rounded-lg bg-[#151515] hover:bg-[#1c1c1e] text-gray-300 hover:text-white border border-[#282828] hover:border-[#FFFF00]/50">
                        <Eye className="w-4 h-4" />
                        <div className="text-center">
                          <div className="text-xs font-medium">Upscale Portrait</div>
                          <div className="text-xs text-gray-500">Optimized for faces</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Area Protection Controls - Only show for RunningHub */}
              {selectedModel === 'runninghub-flux-upscaling' && (
                <div className="rounded-2xl border border-[#1c1c1e] bg-[#0a0a0a] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                  <div className="px-5 pt-3 pb-3 border-b border-[#1c1c1e]">
                    <h3 className="text-lg font-normal tracking-wide text-white">Keep Certain Areas Unchanged</h3>
                  </div>
                  <div className="px-5 pt-4 pb-3">
                    <p className="text-xs font-light text-gray-400 mb-4 leading-tight">
                      These options control which facial features will be preserved during enhancement. By default, mouth, lips and eyes are already selected to maintain natural expressions.
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-xs font-light px-3 py-1 bg-[#151515] text-gray-400 rounded-full">7 selected</div>
                      <button
                        type="button"
                        className="text-xs font-light px-3 py-1 bg-[#151515] text-gray-400 rounded-full hover:bg-[#1c1c1e] hover:text-white transition-colors duration-200"
                        onClick={() => {
                          setAreaProtection(prev => ({
                            face: Object.keys(prev.face).reduce((acc, key) => ({ ...acc, [key]: false }), {} as any),
                            eyes: Object.keys(prev.eyes).reduce((acc, key) => ({ ...acc, [key]: false }), {} as any)
                          }))
                        }}
                      >
                        Reset all
                      </button>
                    </div>

                    <div className="bg-[#151515] rounded-xl border border-[#282828] p-4">
                      <div className="space-y-4">
                        {/* FACE */}
                        <div className="backdrop-blur-sm bg-gradient-to-b from-[#0a0a0a]/95 to-[#0a0a0a]/90 rounded-lg p-3 border border-[#1c1c1e]/30">
                          <h4 className="text-xs font-medium tracking-wider text-gray-400 uppercase mb-3">Face</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(areaProtection.face).map(([key, value]) => (
                              <label key={key} className="group flex items-center cursor-pointer justify-between bg-gradient-to-r from-[#111111] to-[#0d0d0d] rounded-md border border-[#1c1c1e]/50 px-3 py-2 transition-all duration-300 hover:border-[#282828]">
                                <span className="text-xs font-light text-gray-300 tracking-wide group-hover:text-white transition-colors duration-200 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <div className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={value}
                                    onChange={() => updateAreaProtection('face', key, !value)}
                                  />
                                  <div className={cn(
                                    "w-8 h-5 rounded-full transition-all duration-300 flex items-center",
                                    value
                                      ? "bg-[#FFFF00] shadow-sm shadow-blue-500/20"
                                      : "bg-gradient-to-r from-[#1c1c1e] to-[#1c1c1e]/80"
                                  )}>
                                    <div className={cn(
                                      "w-3.5 h-3.5 rounded-full transition-all duration-300 shadow-sm",
                                      value
                                        ? "bg-white translate-x-[18px]"
                                        : "bg-gray-400 translate-x-[2px]"
                                    )} />
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* EYES */}
                        <div className="backdrop-blur-sm bg-gradient-to-b from-[#0a0a0a]/95 to-[#0a0a0a]/90 rounded-lg p-3 border border-[#1c1c1e]/30">
                          <h4 className="text-xs font-medium tracking-wider text-gray-400 uppercase mb-3">Eyes</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(areaProtection.eyes).map(([key, value]) => (
                              <label key={key} className="group flex items-center cursor-pointer justify-between bg-gradient-to-r from-[#111111] to-[#0d0d0d] rounded-md border border-[#1c1c1e]/50 px-3 py-2 transition-all duration-300 hover:border-[#282828]">
                                <span className="text-xs font-light text-gray-300 tracking-wide group-hover:text-white transition-colors duration-200">
                                  {key === 'eyeGeneral' ? 'Eye General'
                                    : key === 'rightEye' ? 'Right Eye'
                                      : key === 'leftBrow' ? 'Left Brow'
                                        : key === 'rightBrow' ? 'Right Brow'
                                          : 'Left Eye'}
                                </span>
                                <div className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={value}
                                    onChange={() => updateAreaProtection('eyes', key, !value)}
                                  />
                                  <div className={cn(
                                    "w-8 h-5 rounded-full transition-all duration-300 flex items-center",
                                    value
                                      ? "bg-[#FFFF00] shadow-sm shadow-blue-500/20"
                                      : "bg-gradient-to-r from-[#1c1c1e] to-[#1c1c1e]/80"
                                  )}>
                                    <div className={cn(
                                      "w-3.5 h-3.5 rounded-full transition-all duration-300 shadow-sm",
                                      value
                                        ? "bg-white translate-x-[18px]"
                                        : "bg-gray-400 translate-x-[2px]"
                                    )} />
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MyTaskLoader */}
      <MyTaskLoader
        isVisible={isEnhancing}
        progress={enhancementProgress}
        status={enhancementStatus}
        message={enhancementMessage}
      />

      {/* MyPopupView */}
      {showPopup && uploadedImage && enhancedImage && (
        <MyPopupView
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          beforeImage={uploadedImage}
          afterImage={enhancedImage}
          title="Enhanced Image Comparison"
          description="Compare your original image with the AI-enhanced version"
        />
      )}
    </div>
  )
}