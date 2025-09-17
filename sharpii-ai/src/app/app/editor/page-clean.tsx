"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  Download,
  X,
  Maximize2,
  DollarSign,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  Zap
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
    name: 'FLUX Upscaling',
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
    scheduler: { type: 'select', default: 'DPM++ 2M', options: ['Simple', 'SGM Uniform', 'Karras', 'Exponential', 'DDIM Uniform', 'Beta', 'Normal', 'AYS'], label: 'Scheduler' },
    enable_upscale: { type: 'boolean', default: true, label: 'Enable Upscaling' },
    upscaler: { type: 'select', default: '4x RealWebPhoto v4', options: ['4x RealWebPhoto v4', '4x NMKD-Siax 200k', '4x UltraSharp', 'RealESRGAN x4+'], label: 'Upscaler Model' },
    sampler_name: { type: 'select', default: 'DPM++ 2M', options: ['DPM++ 2M', 'Euler', 'Euler Ancestral', 'Heun', 'DPM 2', 'DPM 2 Ancestral', 'LMS', 'DPM++ SDE', 'DPM++ 2S Ancestral'], label: 'Sampling Method' },
    seed: { type: 'number', default: 0, min: 0, max: 999999999, label: 'Seed (0 for random)' }
  },
  'fermatresearch/magic-image-refiner': {
    creativity: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.1, label: 'Creativity Level' },
    hdr: { type: 'boolean', default: false, label: 'HDR Enhancement' },
    resemblance: { type: 'number', default: 0.8, min: 0, max: 1, step: 0.1, label: 'Resemblance to Original' }
  }
}

// iOS-style Task Loader Component with proper glassmorphism
function MyTaskLoader({ isVisible, progress, status, message }: {
  isVisible: boolean
  progress: number
  status: 'loading' | 'success' | 'error'
  message: string
}) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center items-end pb-8 pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="pointer-events-auto"
        >
          <div
            className="backdrop-blur-xl bg-black/80 border border-white/10 rounded-full px-5 py-3 shadow-2xl flex items-center gap-3 min-w-[280px] max-w-sm mx-auto"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              background: 'rgba(0, 0, 0, 0.75)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Circular Progress Indicator */}
            <div className="relative w-5 h-5 flex-shrink-0">
              {status === 'loading' && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                  <svg className="absolute inset-0 w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="url(#progressGradient)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - progress / 100)}`}
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
              {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            </div>

            {/* Loading Text */}
            <span className="text-sm font-medium text-white flex-1 truncate">
              {status === 'loading' ? 'Enhancing...' : message}
            </span>

            {/* Linear Progress Indicator */}
            {status === 'loading' && (
              <div className="w-20 bg-white/10 rounded-full h-1 overflow-hidden flex-shrink-0">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
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
      setEstimatedCredits(120) // fallback based on 1MP base price
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

  // Helper function to render model-specific controls
  const renderModelControls = () => {
    const controls = MODEL_CONTROLS[selectedModel as keyof typeof MODEL_CONTROLS]
    if (!controls) return null

    return Object.entries(controls).map(([key, config]) => {
      const currentValue = modelSettings[key] || config.default

      switch (config.type) {
        case 'text':
          return (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{config.label}</label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setModelSettings(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-[#151515] border border-[#282828] rounded-lg text-gray-300 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                placeholder={config.default}
              />
            </div>
          )

        case 'number':
          return (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">{config.label}</label>
                <span className="text-sm text-gray-400">{currentValue}</span>
              </div>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step || 1}
                value={currentValue}
                onChange={(e) => setModelSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full h-2 bg-[#282828] rounded-lg appearance-none cursor-pointer slider-premium"
              />
            </div>
          )

        case 'boolean':
          return (
            <div key={key} className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-gray-300">{config.label}</label>
              <div
                className="relative cursor-pointer"
                onClick={() => setModelSettings(prev => ({ ...prev, [key]: !currentValue }))}
              >
                <div className={cn(
                  "w-10 h-5 rounded-full transition-all duration-300 flex items-center",
                  currentValue
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm shadow-blue-500/20"
                    : "bg-[#282828]"
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                    currentValue
                      ? "bg-white translate-x-[20px]"
                      : "bg-gray-400 translate-x-[2px]"
                  )} />
                </div>
              </div>
            </div>
          )

        case 'select':
          return (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{config.label}</label>
              <select
                value={currentValue}
                onChange={(e) => setModelSettings(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-[#151515] border border-[#282828] rounded-lg text-gray-300 text-sm focus:border-blue-500 focus:outline-none transition-colors"
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

      <div className="max-w-6xl mx-auto relative pt-20 px-6">
        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Left Sidebar - Input Controls */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">AI Image Enhancement</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-md text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Help
                </button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-md transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Image Upload Section - Redesigned */}
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Input Image</h3>

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
                  className="w-full aspect-square max-w-xs mx-auto border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-300 mb-1">Drop your image here</p>
                    <p className="text-xs text-gray-500">or click to browse</p>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <img
                    src={uploadedImage}
                    alt="Input image"
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-white" />
                      <p className="text-sm text-white">Change Image</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-300">
                    {imageSize.width} × {imageSize.height}
                  </div>
                </div>
              )}
            </div>

            {/* Model Selection - Redesigned */}
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">AI Enhancement Model</h3>

              <div className="space-y-3">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={cn(
                      "w-full p-4 rounded-lg border transition-all duration-200 text-left",
                      selectedModel === model.id
                        ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/50 text-white"
                        : "bg-[#121212] border-[#2a2a2a] text-gray-300 hover:border-gray-600 hover:bg-[#151515]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{model.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{model.name}</span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-md",
                            selectedModel === model.id
                              ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white"
                              : "bg-gray-800 text-gray-400"
                          )}>
                            {model.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <Zap className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enhancement Settings */}
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Enhancement Settings</h3>

              {/* Enhancement Type */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-3 block">Enhancement Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEnhancementType('face')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      enhancementType === 'face'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-gray-600"
                    )}
                  >
                    Face
                  </button>
                  <button
                    onClick={() => setEnhancementType('body')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      enhancementType === 'body'
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-gray-600"
                    )}
                  >
                    Body
                  </button>
                </div>
              </div>

              {/* Enhancement Mode */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-3 block">Enhancement Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['standard', 'detailed', 'heavy'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEnhancementMode(mode as typeof enhancementMode)}
                      disabled={mode === 'heavy'}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 capitalize relative",
                        enhancementMode === mode
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-gray-600",
                        mode === 'heavy' && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {mode}
                      {mode === 'detailed' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Adjustment Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Skin Texture</label>
                    <span className="text-sm text-gray-500">{skinTextureAdjuster.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="0.5"
                    step="0.01"
                    value={skinTextureAdjuster}
                    onChange={(e) => setSkinTextureAdjuster(Number(e.target.value))}
                    className="w-full h-2 bg-[#282828] rounded-lg appearance-none cursor-pointer slider-premium"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Smooth</span>
                    <span>Detailed</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Realism Level</label>
                    <span className="text-sm text-gray-500">{skinReductionLevel.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={skinReductionLevel}
                    onChange={(e) => setSkinReductionLevel(Number(e.target.value))}
                    className="w-full h-2 bg-[#282828] rounded-lg appearance-none cursor-pointer slider-premium"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Stylized</span>
                    <span>Realistic</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model-Specific Controls */}
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Model Settings</h3>
              <div className="space-y-4">
                {renderModelControls()}
              </div>
            </div>

            {/* Pricing and Enhance Button */}
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">{estimatedCredits} Credits</span>
                </div>
                <div className="text-xs text-gray-500">{imageSize.width} × {imageSize.height} px</div>
              </div>

              <button
                onClick={handleEnhancement}
                disabled={!uploadedImage || isEnhancing}
                className="w-full py-3 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  'Enhance'
                )}
              </button>
            </div>
          </div>

          {/* Right Side - Result Area */}
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Enhanced Result</h3>

              {!uploadedImage ? (
                <div className="aspect-square bg-[#111] rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">Upload an image to get started</p>
                  </div>
                </div>
              ) : enhancedImage ? (
                <div className="relative group">
                  <img
                    src={enhancedImage}
                    alt="Enhanced result"
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                    onClick={() => setShowPopup(true)}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowPopup(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" />
                        Compare
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = enhancedImage
                          link.download = `enhanced_${Date.now()}.jpg`
                          link.click()
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg text-white hover:from-blue-500/30 hover:to-purple-500/30 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-gradient-to-r from-green-500/80 to-emerald-500/80 px-3 py-1.5 rounded-full text-xs text-white backdrop-blur-sm">
                    ✨ Enhancement complete
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-[#111] rounded-lg flex items-center justify-center relative overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Original image"
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-300 mb-2">Ready to enhance</p>
                      <p className="text-sm text-gray-500">Click 'Enhance' to begin</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Area Protection Settings - Only show for RunningHub */}
            {selectedModel === 'runninghub-flux-upscaling' && (
              <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-300">Keep Certain Areas Unchanged</h3>
                  <button
                    onClick={() => {
                      setAreaProtection(prev => ({
                        face: Object.keys(prev.face).reduce((acc, key) => ({ ...acc, [key]: false }), {} as any),
                        eyes: Object.keys(prev.eyes).reduce((acc, key) => ({ ...acc, [key]: false }), {} as any)
                      }))
                    }}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Reset all
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">These options control which facial features will be preserved during enhancement. By default, mouth, lips and eyes are already selected to maintain natural expressions.</p>

                <div className="space-y-4">
                  {/* Face Features */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Face</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(areaProtection.face).map(([key, value]) => (
                        <label key={key} className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                          <span className="text-sm text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div
                            onClick={() => updateAreaProtection('face', key, !value)}
                            className="relative cursor-pointer"
                          >
                            <div className={cn(
                              "w-10 h-5 rounded-full transition-all duration-300 flex items-center",
                              value
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm shadow-blue-500/20"
                                : "bg-[#2a2a2a]"
                            )}>
                              <div className={cn(
                                "w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                                value
                                  ? "bg-white translate-x-[20px]"
                                  : "bg-gray-400 translate-x-[2px]"
                              )} />
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Eye Features */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Eyes</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(areaProtection.eyes).map(([key, value]) => (
                        <label key={key} className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                          <span className="text-sm text-gray-300">
                            {key === 'eyeGeneral' ? 'Eye General' :
                             key === 'rightEye' ? 'Right Eye' :
                             key === 'leftEye' ? 'Left Eye' :
                             key === 'leftBrow' ? 'Left Brow' :
                             key === 'rightBrow' ? 'Right Brow' : key}
                          </span>
                          <div
                            onClick={() => updateAreaProtection('eyes', key, !value)}
                            className="relative cursor-pointer"
                          >
                            <div className={cn(
                              "w-10 h-5 rounded-full transition-all duration-300 flex items-center",
                              value
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm shadow-blue-500/20"
                                : "bg-[#2a2a2a]"
                            )}>
                              <div className={cn(
                                "w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                                value
                                  ? "bg-white translate-x-[20px]"
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
            )}
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