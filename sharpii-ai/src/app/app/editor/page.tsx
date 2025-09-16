"use client"

import React, { useState, useRef, useCallback } from "react"
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
    id: 'replicate/magic-image-refiner',
    name: 'Magic Image Refiner',
    provider: 'replicate',
    category: 'Standard',
    description: 'Refines image quality and details',
    icon: '✨'
  },
  {
    id: 'replicate/batoure-face-enhancer',
    name: 'Batoure Face Enhancer',
    provider: 'replicate',
    category: 'Portrait',
    description: 'Specialized facial enhancement',
    icon: '👤'
  }
]

// iOS-style Task Loader Component
function MyTaskLoader({ isVisible, progress, status, message }: {
  isVisible: boolean
  progress: number
  status: 'loading' | 'success' | 'error'
  message: string
}) {
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[9999]"
        style={{ transform: 'translate(-50%, 0)' }}
      >
        <div className="backdrop-blur-xl bg-black/70 border border-white/20 rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 min-w-[280px]">
          {/* Circular Progress Indicator */}
          <div className="relative w-6 h-6 flex-shrink-0">
            {status === 'loading' && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                <svg className="absolute inset-0 w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="url(#progressGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
                    className="transition-all duration-300 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </>
            )}
            {status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-400" />}
            {status === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
          </div>

          {/* Loading Text */}
          <span className="text-sm font-medium text-white flex-1 truncate">{message}</span>

          {/* Linear Progress Indicator */}
          {status === 'loading' && (
            <div className="w-16 bg-white/10 rounded-full h-1 overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
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

  // Advanced model settings - based on actual API parameters
  const [modelSettings, setModelSettings] = useState({
    // RunningHub FLUX parameters
    prompt: 'high quality, detailed, enhanced',
    seed: 0,
    steps: 10,
    guidance_scale: 3.5,
    denoise: 0.3,
    sampler_name: 'dpmpp_2m',
    scheduler: 'sgm_uniform',
    upscale_model: '4xRealWebPhoto_v4_dat2.pth',
    upscale_method: 'lanczos',
    megapixels: 5,
    enable_upscale: true,

    // Basic enhancement settings for all models
    enhancementStrength: 0.75,
    preserveDetails: true
  })

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
          imageWidth: imageSize.width,
          imageHeight: imageSize.height
        }
      )
      setEstimatedCredits(result.totalCredits)
    } catch (error) {
      console.warn('Failed to calculate credits:', error)
      setEstimatedCredits(100) // fallback
    }
  }, [imageSize, selectedModel, modelSettings])

  React.useEffect(() => {
    updateEstimatedCredits()
  }, [updateEstimatedCredits])

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

      if (result.success && result.enhancedUrl) {
        setEnhancedImage(result.enhancedUrl)
        setEnhancementStatus('success')
        setEnhancementMessage('Enhancement completed successfully!')
        setEnhancementProgress(100)

        // Hide success message after 3 seconds
        setTimeout(() => {
          setIsEnhancing(false)
        }, 3000)
      } else {
        throw new Error(result.error || 'Enhancement failed')
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
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0">
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
                          className="w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden relative group cursor-pointer border border-[#282828] flex items-center justify-center"
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                            <p className="text-[8px] md:text-[9px] font-medium text-gray-300">Upload Image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden relative group cursor-pointer border border-[#282828]">
                          <img
                            src={uploadedImage}
                            alt="Input"
                            className="w-full h-full object-cover"
                            onClick={() => fileInputRef.current?.click()}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="text-center">
                              <Upload className="w-6 h-6 mx-auto mb-1 text-white" />
                              <p className="text-[8px] md:text-[9px] font-medium text-gray-300">Change Image</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="space-y-3">
                        {/* Model Selection */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-3">AI Enhancement Model</h3>
                          <div className="space-y-2">
                            {AVAILABLE_MODELS.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                className={cn(
                                  "w-full p-3 rounded-lg border transition-all duration-200 text-left",
                                  selectedModel === model.id
                                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 text-white"
                                    : "bg-[#151515] border-[#282828] text-gray-300 hover:border-blue-500/30 hover:bg-[#1c1c1e]"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{model.icon}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{model.name}</span>
                                      <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        selectedModel === model.id
                                          ? "bg-blue-500/30 text-blue-200"
                                          : "bg-gray-700 text-gray-400"
                                      )}>
                                        {model.category}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{model.description}</p>
                                  </div>
                                  {selectedModel === model.id && (
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                  )}
                                </div>
                              </button>
                            ))}
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
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                  : "bg-[#151515] text-gray-400 hover:text-white border border-[#282828] hover:border-blue-500/50 hover:bg-[#1c1c1e]"
                              )}
                            >
                              Face
                            </button>
                            <button
                              onClick={() => setEnhancementType('body')}
                              className={cn(
                                "w-full px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                                enhancementType === 'body'
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                  : "bg-[#151515] text-gray-400 hover:text-white border border-[#282828] hover:border-blue-500/50 hover:bg-[#1c1c1e]"
                              )}
                            >
                              Body
                            </button>
                          </div>
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
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
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

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between px-0.5">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-medium text-gray-300">Cost: {estimatedCredits} Credits</span>
                        </div>
                        <div className="text-[10px] font-medium text-gray-400">{imageSize.width} × {imageSize.height} px</div>
                      </div>


                      <div className="relative overflow-hidden rounded-xl shadow-lg border border-gradient-to-r from-blue-500 to-purple-500">
                        <button
                          onClick={handleEnhancement}
                          disabled={!uploadedImage || isEnhancing}
                          className="w-full px-8 py-2.5 text-base font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          {isEnhancing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Enhance {enhancementType === 'face' ? 'Face' : 'Body'}
                            </>
                          )}
                        </button>
                      </div>
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
                        {selectedModel === 'runninghub-flux-upscaling' && (
                          <>
                            {/* Prompt */}
                            <div>
                              <label className="text-xs font-light text-gray-300 mb-1 block">Enhancement Prompt</label>
                              <input
                                type="text"
                                value={modelSettings.prompt}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, prompt: e.target.value }))}
                                placeholder="high quality, detailed, enhanced"
                                className="w-full px-2 py-1 text-xs bg-[#151515] border border-[#282828] rounded text-gray-300 focus:border-blue-500 focus:outline-none"
                              />
                            </div>

                            {/* Steps */}
                            <div>
                              <label className="text-xs font-light text-gray-300 flex justify-between">
                                <span>Denoising Steps</span>
                                <span className="text-gray-400">{modelSettings.steps}</span>
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="50"
                                step="1"
                                value={modelSettings.steps}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, steps: Number(e.target.value) }))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Fast (1)</span>
                                <span>Quality (50)</span>
                              </div>
                            </div>

                            {/* Guidance Scale */}
                            <div>
                              <label className="text-xs font-light text-gray-300 flex justify-between">
                                <span>Guidance Scale</span>
                                <span className="text-gray-400">{modelSettings.guidance_scale}</span>
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="20"
                                step="0.1"
                                value={modelSettings.guidance_scale}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, guidance_scale: Number(e.target.value) }))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Flexible (1)</span>
                                <span>Strict (20)</span>
                              </div>
                            </div>

                            {/* Denoise Strength */}
                            <div>
                              <label className="text-xs font-light text-gray-300 flex justify-between">
                                <span>Denoise Strength</span>
                                <span className="text-gray-400">{modelSettings.denoise}</span>
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={modelSettings.denoise}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, denoise: Number(e.target.value) }))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Preserve Original</span>
                                <span>Full Enhancement</span>
                              </div>
                            </div>

                            {/* Target Megapixels */}
                            <div>
                              <label className="text-xs font-light text-gray-300 flex justify-between">
                                <span>Target Megapixels</span>
                                <span className="text-gray-400">{modelSettings.megapixels}MP</span>
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="20"
                                step="0.1"
                                value={modelSettings.megapixels}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, megapixels: Number(e.target.value) }))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
                              />
                            </div>

                            {/* Enable Upscaling Toggle */}
                            <div>
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-xs font-light text-gray-300">Enable Upscaling</span>
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={modelSettings.enable_upscale}
                                    onChange={(e) => setModelSettings(prev => ({ ...prev, enable_upscale: e.target.checked }))}
                                  />
                                  <div className={cn(
                                    "w-10 h-5 rounded-full transition-all duration-300 flex items-center",
                                    modelSettings.enable_upscale
                                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20"
                                      : "bg-gradient-to-r from-[#1c1c1e] to-[#1c1c1e]/80"
                                  )}>
                                    <div className={cn(
                                      "w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                                      modelSettings.enable_upscale
                                        ? "bg-white translate-x-[22px]"
                                        : "bg-gray-400 translate-x-[2px]"
                                    )} />
                                  </div>
                                </div>
                              </label>
                            </div>

                            {/* Upscale Model Selection */}
                            {modelSettings.enable_upscale && (
                              <div>
                                <label className="text-xs font-light text-gray-300 mb-1 block">Upscale Model</label>
                                <select
                                  value={modelSettings.upscale_model}
                                  onChange={(e) => setModelSettings(prev => ({ ...prev, upscale_model: e.target.value }))}
                                  className="w-full px-2 py-1 text-xs bg-[#151515] border border-[#282828] rounded text-gray-300 focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="4xRealWebPhoto_v4_dat2.pth">4x RealWebPhoto v4</option>
                                  <option value="4x_NMKD-Siax_200k.pth">4x NMKD-Siax 200k</option>
                                  <option value="4x-UltraSharp.pth">4x UltraSharp</option>
                                  <option value="RealESRGAN_x4plus.pth">RealESRGAN x4+</option>
                                </select>
                              </div>
                            )}

                            {/* Sampling Method */}
                            <div>
                              <label className="text-xs font-light text-gray-300 mb-1 block">Sampling Method</label>
                              <select
                                value={modelSettings.sampler_name}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, sampler_name: e.target.value }))}
                                className="w-full px-2 py-1 text-xs bg-[#151515] border border-[#282828] rounded text-gray-300 focus:border-blue-500 focus:outline-none"
                              >
                                <option value="dpmpp_2m">DPM++ 2M</option>
                                <option value="euler">Euler</option>
                                <option value="euler_ancestral">Euler Ancestral</option>
                                <option value="heun">Heun</option>
                                <option value="dpm_2">DPM 2</option>
                                <option value="dpm_2_ancestral">DPM 2 Ancestral</option>
                                <option value="lms">LMS</option>
                                <option value="dpmpp_sde">DPM++ SDE</option>
                                <option value="dpmpp_2s_ancestral">DPM++ 2S Ancestral</option>
                              </select>
                            </div>

                            {/* Scheduler */}
                            <div>
                              <label className="text-xs font-light text-gray-300 mb-1 block">Noise Scheduler</label>
                              <select
                                value={modelSettings.scheduler}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, scheduler: e.target.value }))}
                                className="w-full px-2 py-1 text-xs bg-[#151515] border border-[#282828] rounded text-gray-300 focus:border-blue-500 focus:outline-none"
                              >
                                <option value="simple">Simple</option>
                                <option value="sgm_uniform">SGM Uniform</option>
                                <option value="karras">Karras</option>
                                <option value="exponential">Exponential</option>
                                <option value="ddim_uniform">DDIM Uniform</option>
                                <option value="beta">Beta</option>
                                <option value="normal">Normal</option>
                                <option value="ays">AYS</option>
                              </select>
                            </div>

                            {/* Seed */}
                            <div>
                              <label className="text-xs font-light text-gray-300 mb-1 block">Seed (0 = Random)</label>
                              <input
                                type="number"
                                min="0"
                                max="2147483647"
                                value={modelSettings.seed}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, seed: Number(e.target.value) }))}
                                placeholder="0 for random"
                                className="w-full px-2 py-1 text-xs bg-[#151515] border border-[#282828] rounded text-gray-300 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </>
                        )}

                        {(selectedModel === 'fermatresearch/magic-image-refiner' || selectedModel.includes('replicate/')) && (
                          <>
                            {/* Enhancement Strength */}
                            <div>
                              <label className="text-xs font-light text-gray-300 flex justify-between">
                                <span>Enhancement Strength</span>
                                <span className="text-gray-400">{modelSettings.enhancementStrength}</span>
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={modelSettings.enhancementStrength}
                                onChange={(e) => setModelSettings(prev => ({ ...prev, enhancementStrength: Number(e.target.value) }))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#282828] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#282828]"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Subtle</span>
                                <span>Strong</span>
                              </div>
                            </div>

                            {/* Preserve Details */}
                            <div>
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-xs font-light text-gray-300">Preserve Fine Details</span>
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={modelSettings.preserveDetails}
                                    onChange={(e) => setModelSettings(prev => ({ ...prev, preserveDetails: e.target.checked }))}
                                  />
                                  <div className={cn(
                                    "w-10 h-5 rounded-full transition-all duration-300 flex items-center",
                                    modelSettings.preserveDetails
                                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20"
                                      : "bg-gradient-to-r from-[#1c1c1e] to-[#1c1c1e]/80"
                                  )}>
                                    <div className={cn(
                                      "w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                                      modelSettings.preserveDetails
                                        ? "bg-white translate-x-[22px]"
                                        : "bg-gray-400 translate-x-[2px]"
                                    )} />
                                  </div>
                                </div>
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    </details>
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
                          <div className="relative w-full h-full">
                            <img src={enhancedImage} alt="Enhanced" className="w-full h-full object-contain" />
                            <div className="absolute bottom-4 right-4 flex space-x-2">
                              <button
                                onClick={() => setShowPopup(true)}
                                className="p-2 rounded-full transition-colors bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
                                title="Expand view"
                              >
                                <Expand className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = enhancedImage
                                  link.download = `enhanced-image-${Date.now()}.jpg`
                                  link.click()
                                }}
                                className="p-2 rounded-full transition-colors bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"
                                title="Download image"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-4 left-4 text-sm font-light text-white bg-gradient-to-r from-green-500/80 to-emerald-500/80 px-3 py-1.5 rounded-full backdrop-blur-sm border border-green-400/30">
                              ✨ Enhancement complete
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 lg:py-2.5 px-3 text-sm font-medium transition-all duration-200 flex flex-col lg:flex-row items-center justify-center gap-1.5 rounded-lg bg-[#151515] hover:bg-[#1c1c1e] text-gray-300 hover:text-white border border-[#282828] hover:border-blue-500/50">
                        <TrendingUp className="w-4 h-4" />
                        <div className="text-center">
                          <div className="text-xs font-medium">Upscale Image</div>
                          <div className="text-xs text-gray-500">General upscaling</div>
                        </div>
                      </button>
                      <button className="flex-1 py-2 lg:py-2.5 px-3 text-sm font-medium transition-all duration-200 flex flex-col lg:flex-row items-center justify-center gap-1.5 rounded-lg bg-[#151515] hover:bg-[#1c1c1e] text-gray-300 hover:text-white border border-[#282828] hover:border-blue-500/50">
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

              {/* Area Protection Controls */}
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
                    <button type="button" className="text-xs font-light px-3 py-1 bg-[#151515] text-gray-400 rounded-full hover:bg-[#1c1c1e] hover:text-white transition-colors duration-200">Reset all</button>
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
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20"
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
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20"
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