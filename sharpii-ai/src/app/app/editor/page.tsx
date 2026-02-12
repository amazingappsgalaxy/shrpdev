"use client"

import React, { useState, useRef, useCallback, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  IconUpload,
  IconDownload,
  IconLoader2,
  IconSparkles,
  IconPhoto,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconArrowsHorizontal,
  IconWand,
  IconArrowsMaximize,
  IconUser,
  IconEye,
  IconTrash
} from "@tabler/icons-react"
// Removed STYLE_MAPPING and STYLE_LORAS as they are no longer supported

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import UserHeader from "@/components/app/UserHeader"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import { ModelPricingEngine } from "@/lib/model-pricing-config"
import { MechanicalSlider } from "@/components/ui/mechanical-slider"
import { Switch } from "@/components/ui/switch"
import { DropdownOption } from "@/components/ui/custom-dropdown"
import { ExpandViewModal } from "@/components/ui/expand-view-modal"
import { CreditIcon } from "@/components/ui/CreditIcon"

// --- TYPES ---
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
  other: {
    hair: boolean
    cloth: boolean
    background: boolean
    neck: boolean
  }
}

const DEFAULT_AREA_PROTECTION: AreaProtectionSettings = {
  face: {
    skin: false,
    mouth: false,
    lowerLip: true,
    upperLip: true,
    nose: false
  },
  eyes: {
    eyeGeneral: false,
    rightEye: true,
    leftBrow: false,
    rightBrow: false,
    leftEye: true
  },
  other: {
    hair: false,
    cloth: false,
    background: false,
    neck: false
  }
}

// Available models configuration
const AVAILABLE_MODELS = [
  {
    id: 'skin-editor',
    name: 'Skin Editor',
    provider: 'runninghub',
    category: 'Specialized',
    description: 'Professional skin retouching',
    icon: IconSparkles,
  }
]

// Model-specific control configurations
const MODEL_CONTROLS = {
  'skin-editor': {
    denoise: { type: 'number', default: 0.35, min: 0.1, max: 0.38, step: 0.01, label: 'Effect Strength', leftLabel: 'Subtle', rightLabel: 'Strong' },
    megapixels: { type: 'number', default: 4, min: 2, max: 10, step: 1, label: 'Detail Level (MP)', leftLabel: 'Low', rightLabel: 'High' },
    maxshift: { type: 'number', default: 1, min: 0.8, max: 1.2, step: 0.1, label: 'Max Shift', leftLabel: 'Low', rightLabel: 'High' }
  }
}

const STYLES = [
  { id: 'style1', name: 'Polyhedron', value: 'FLUX_Polyhedron_all_Kohya_ss-000001.safetensors' },
  { id: 'style2', name: 'Skin', value: 'skin.safetensors' },
  { id: 'style3', name: 'Freckles', value: 'freckles-flux.safetensors' },
  { id: 'style4', name: 'Realism', value: 'Realim_Lora_BSY_IL_V1_RA42.safetensors' }
]

// Enhancement mode options by model
const MODES_BY_MODEL: Record<string, DropdownOption[]> = {
  'skin-editor': [
    { value: 'Subtle', label: 'Subtle', description: 'Natural texture preservation' },
    { value: 'Clear', label: 'Clear', description: 'Balanced smoothing' },
    { value: 'Pimples', label: 'Blemish Removal', description: 'Focus on acne removal' },
    { value: 'Freckles', label: 'Freckle Enhancer', description: 'Enhance natural freckles' }
  ],
  'default': [
    { value: 'standard', label: 'Standard', description: 'Balanced enhancement' },
    { value: 'detailed', label: 'Detailed', description: 'Maximum detail recovery' },
    { value: 'heavy', label: 'Heavy', description: 'Aggressive processing' }
  ]
}

// Default settings per mode for Skin Editor
const SKIN_EDITOR_DEFAULTS = {
  Subtle: { denoise: 0.20, maxshift: 1, megapixels: 4 },
  Clear: { denoise: 0.35, maxshift: 1.2, megapixels: 4 },
  Pimples: { denoise: 0.37, maxshift: 1.2, megapixels: 2 },
  Freckles: { denoise: 0.37, maxshift: 1.2, megapixels: 2 }
}

// --- COMPONENTS ---

function ComparisonView({
  original,
  enhanced,
  onDownload,
  onExpand
}: {
  original: string
  enhanced: string
  onDownload?: () => void
  onExpand?: () => void
}) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    setSliderPos((x / rect.width) * 100)
  }, [])

  return (
    <div
      className="relative w-full h-full bg-[#050505] overflow-hidden select-none group"
      ref={containerRef}
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
    >
      {/* Images */}
      <img src={original} className="absolute inset-0 w-full h-full object-contain" alt="Original" draggable={false} />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
      >
        <img src={enhanced} className="absolute inset-0 w-full h-full object-contain" alt="Enhanced" draggable={false} />
      </div>

      {/* Slider Line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 cursor-ew-resize"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <IconArrowsHorizontal className="w-4 h-4 text-black" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur text-white/80 text-xs font-medium rounded border border-white/10 uppercase tracking-wider">Original</div>
      <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-bold rounded border border-white/20 uppercase tracking-wider shadow-lg">Enhanced</div>

      {/* Action Buttons */}
      <div className="absolute bottom-6 right-6 flex gap-3 z-30">
        {onExpand && (
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="p-3 bg-white text-black rounded-full shadow-xl hover:scale-105 transition-transform"
            title="Expand view"
          >
            <IconArrowsMaximize className="w-5 h-5" />
          </button>
        )}

        {onDownload && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-3 bg-white text-black rounded-full shadow-xl hover:scale-105 transition-transform"
            title="Download"
          >
            <IconDownload className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

function EditorContent() {
  const { user, isLoading } = useAuth()
  const searchParams = useSearchParams()

  // State: Defaulting to USER PROVIDED DEMO IMAGES
  const [uploadedImage, setUploadedImage] = useState<string | null>("https://i.postimg.cc/gJHLjBwj/image.png")
  const [enhancedImage, setEnhancedImage] = useState<string | null>("https://i.postimg.cc/rspsmyXZ/image.png")
  const [imageMetadata, setImageMetadata] = useState({ width: 1024, height: 1024 })

  // Settings
  // Force Skin Editor as default and only model
  const [selectedModel, setSelectedModel] = useState('skin-editor')
  const [selectedStyle, setSelectedStyle] = useState(STYLES[1]?.id || 'style2') // Default to Skin style

  // Dynamic default mode based on model
  const [enhancementMode, setEnhancementMode] = useState<string>('Subtle')
  const [modelSettings, setModelSettings] = useState<Record<string, any>>({})
  const [areaSettings, setAreaSettings] = useState<AreaProtectionSettings>(DEFAULT_AREA_PROTECTION)

  // UI State
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isExpandViewOpen, setIsExpandViewOpen] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize from URL param
  useEffect(() => {
    const modelParam = searchParams.get('model')
    if (modelParam && AVAILABLE_MODELS.find(m => m.id === modelParam)) {
      setSelectedModel(modelParam)
    }
  }, [searchParams])

  // Update mode when model changes
  useEffect(() => {
    const modes = MODES_BY_MODEL[selectedModel] || MODES_BY_MODEL['default'] || []
    if (modes.length > 0 && modes[0]) {
      setEnhancementMode(modes[0].value)
    }
  }, [selectedModel])

  // Update settings when mode changes (specifically for Skin Editor)
  useEffect(() => {
    if (selectedModel === 'skin-editor' && enhancementMode in SKIN_EDITOR_DEFAULTS) {
      const defaults = SKIN_EDITOR_DEFAULTS[enhancementMode as keyof typeof SKIN_EDITOR_DEFAULTS]
      setModelSettings(prev => ({ ...prev, ...defaults }))
    }
  }, [enhancementMode, selectedModel])

  // Setup default settings when model changes
  useEffect(() => {
    const defaults: Record<string, any> = {}
    const controls = MODEL_CONTROLS[selectedModel as keyof typeof MODEL_CONTROLS] || {}
    Object.entries(controls).forEach(([k, v]) => {
      // @ts-ignore
      defaults[k] = v.default
    })
    setModelSettings(defaults)
  }, [selectedModel])


  // Calculate credits
  const creditCost = React.useMemo(() => {
    try {
      const result = ModelPricingEngine.calculateCredits(
        imageMetadata.width,
        imageMetadata.height,
        selectedModel,
        modelSettings
      )
      return result.totalCredits
    } catch (error) {
      return 120 // fallback
    }
  }, [imageMetadata, selectedModel, modelSettings])

  // Handlers
  const handleUpload = (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImageMetadata({ width: img.width, height: img.height })
        setUploadedImage(e.target?.result as string)
        setEnhancedImage(null) // Reset result
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteImage = () => {
    setUploadedImage(null)
    setEnhancedImage(null)
    setImageMetadata({ width: 1024, height: 1024 })
  }

  const handleEnhance = async () => {
    if (!uploadedImage) return
    setIsEnhancing(true)
    setProgress(0)

    try {
      // 1. Upload image if it's base64 (already handled by RunningHub provider but let's send it)
      // Actually RunningHub provider handles base64 upload to Tebi.
      // So we just call the API route.

      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          modelId: 'skin-editor',
          settings: {
            prompt: 'Enhance skin details, preserve identity, high quality',
            mode: enhancementMode,
            protections: areaSettings,
            style: STYLES.find(s => s.id === selectedStyle)?.value,
            ...modelSettings
          }
        })
      })

      if (!response.ok) {
        throw new Error('Enhancement failed')
      }

      const data = await response.json()
      if (data.success && data.enhancedUrl) {
        setEnhancedImage(data.enhancedUrl)
      } else {
        console.error('Enhancement failed:', data.error)
      }

    } catch (error) {
      console.error('Enhancement error:', error)
    } finally {
      setIsEnhancing(false)
      setProgress(100)
    }
  }

  const handleDownload = async () => {
    if (!enhancedImage) return
    try {
      const response = await fetch(enhancedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enhanced-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback for same-origin or simple cases
      const a = document.createElement('a')
      a.href = enhancedImage
      a.download = `enhanced-${Date.now()}.png`
      a.click()
    }
  }

  if (isLoading || !user) return <ElegantLoading message="Initializing Editor..." />

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-white font-sans">
      <UserHeader />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* Main Layout - Grid with Wider Sidebar & Sticky Canvas */}
      <div className="flex-1 pt-24 w-full grid grid-cols-1 lg:grid-cols-[420px_1fr] items-start">

        {/* LEFT SIDEBAR - CONTROLS (Scrolls with page) */}
        <div className="flex flex-col border-r border-white/5 bg-[#0c0c0e] z-20 relative min-h-[calc(100vh-6rem)] lg:pb-32">

          {/* 1. TOP SECTION: INPUT & STYLES (SIDE BY SIDE) */}
          <div className="grid grid-cols-[35%_65%] border-b border-white/5">
            
            {/* LEFT: INPUT IMAGE */}
            <div className="p-4 border-r border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                 <label className="text-xs font-medium text-white">Input</label>
                 {uploadedImage && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(); }} className="text-gray-500 hover:text-red-400" title="Delete">
                      <IconTrash className="w-3 h-3" />
                    </button>
                 )}
              </div>
              
              <div 
                className="w-full aspect-square rounded-xl bg-black border border-white/10 overflow-hidden relative cursor-pointer group hover:border-[#FFFF00]/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImage ? (
                  <>
                    <img src={uploadedImage} className="w-full h-full object-cover" alt="Input" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <IconUpload className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1">
                    <IconUpload className="w-5 h-5 text-gray-500" />
                    <span className="text-[9px] text-gray-600 font-medium">Upload</span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-[10px] text-gray-500 truncate">
                  {uploadedImage ? `${imageMetadata.width}×${imageMetadata.height}` : 'Select Image'}
                </p>
              </div>
            </div>

            {/* RIGHT: STYLES */}
            <div className="p-3 flex flex-col gap-3">
              <label className="text-xs font-medium text-white">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wide gap-1.5",
                      selectedStyle === style.id
                        ? "bg-[#FFFF00] border-[#FFFF00] text-black shadow-[0_0_20px_rgba(255,255,0,0.3)]"
                        : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      selectedStyle === style.id ? "bg-black" : "bg-gray-600"
                    )} />
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 3. SETTINGS SCROLL AREA */}
          <div className="p-3 space-y-3 flex-1">

            {/* GROUP 1: Primary Controls */}
            <div className="space-y-2 px-1">
              
              {/* VR Upscale Special Setting - MOVED HERE */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 group hover:border-purple-500/40 transition-colors">
                  <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-purple-500/20 text-purple-400 group-hover:text-purple-300 transition-colors">
                          <IconSparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white group-hover:text-purple-200 transition-colors">VR Upscale</span>
                      </div>
                  </div>
                  <Switch
                    checked={!!modelSettings['vr_upscale']}
                    onCheckedChange={(c) => setModelSettings(prev => ({ ...prev, 'vr_upscale': c }))}
                    className="scale-75 data-[state=checked]:bg-purple-500"
                  />
              </div>

              {/* Render Model specific controls */}
              {Object.entries(MODEL_CONTROLS[selectedModel as keyof typeof MODEL_CONTROLS] || {}).map(([key, config]) => {
                const conf = config as { type: string; default: any; label: string; min?: number; max?: number; step?: number; leftLabel?: string; rightLabel?: string }
                const currentValue = modelSettings[key] ?? conf.default

                if (conf.type === 'boolean') {
                  return (
                    <div key={key} className="flex items-center justify-between group p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <span className="text-xs font-medium text-white transition-colors">{conf.label}</span>
                      <Switch
                        checked={!!currentValue}
                        onCheckedChange={(c) => setModelSettings(prev => ({ ...prev, [key]: c }))}
                        className="scale-75 origin-right"
                      />
                    </div>
                  )
                }

                if (conf.type === 'number') {
                  return (
                    <div key={key} className="space-y-2 group p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-medium text-white transition-colors">{conf.label}</span>
                        <span className="font-mono text-[10px] text-white/70 bg-white/5 px-1.5 py-0.5 rounded">{Number(currentValue).toFixed(conf.step && conf.step < 1 ? 2 : 0)}</span>
                      </div>
                      <MechanicalSlider
                        value={[Number(currentValue)]}
                        min={conf.min} max={conf.max} step={conf.step || 1}
                        leftLabel={conf.leftLabel}
                        rightLabel={conf.rightLabel}
                        onValueChange={([v]) => setModelSettings(prev => ({ ...prev, [key]: v }))}
                      />
                    </div>
                  )
                }
                return null
              })}
            </div>

            {/* GROUP 2: Area Protection (3 Sections: Face, Eyes, Other) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 pt-2 border-t border-white/5">
                <IconShieldCheck className="w-3.5 h-3.5 text-white/50" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-wide">Area Protection</span>
              </div>

              {/* Face Features */}
              <div className="grid grid-cols-2 gap-2">
                {/* Face Column */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1 flex items-center gap-1"><IconUser className="w-3 h-3" /> Face</p>
                  <div className="space-y-1">
                    {Object.entries(areaSettings.face).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                        <span className="text-[10px] text-gray-400 capitalize group-hover:text-white transition-colors w-full">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Switch
                          checked={val}
                          onCheckedChange={(c) => setAreaSettings(prev => ({ ...prev, face: { ...prev.face, [key]: c } }))}
                          className="scale-50 origin-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eyes Column */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-1 flex items-center gap-1"><IconEye className="w-3 h-3" /> Eyes</p>
                  <div className="space-y-1">
                    {Object.entries(areaSettings.eyes).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-1.5 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                        <span className="text-[10px] text-gray-400 capitalize group-hover:text-white transition-colors w-full">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Switch
                          checked={val}
                          onCheckedChange={(c) => setAreaSettings(prev => ({ ...prev, eyes: { ...prev.eyes, [key]: c } }))}
                          className="scale-50 origin-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Other Section */}
              <div className="pt-2">
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(areaSettings.other).map(([key, val]) => (
                    <div key={key} className="flex flex-col items-center justify-center p-2 rounded bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group gap-1">
                      <span className="text-[10px] text-gray-400 capitalize group-hover:text-white transition-colors">{key}</span>
                      <Switch
                        checked={val}
                        onCheckedChange={(c) => setAreaSettings(prev => ({ ...prev, other: { ...prev.other, [key]: c } }))}
                        className="scale-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* 4. FOOTER */}
          <div className="lg:fixed lg:bottom-0 lg:left-0 lg:w-[420px] relative w-full bg-[#0c0c0e] border-t border-white/5 z-40">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Estimated Cost</span>
                <div className="flex items-center gap-2">
                  <CreditIcon className="w-6 h-6 rounded-md" iconClassName="w-3 h-3" />
                  <span className="font-mono font-medium text-white/90">{creditCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={handleEnhance}
                disabled={isEnhancing || !uploadedImage}
                className="w-full bg-[#FFFF00] hover:bg-[#e6e600] text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,0,0.1)] hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] text-base uppercase tracking-wider"
              >
                {isEnhancing ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    <span>Processing {progress}%</span>
                  </>
                ) : (
                  <>
                    <IconWand className="w-5 h-5 fill-black" />
                    <span>Enhance Image</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT MAIN CANVAS */}
        <div className="relative flex flex-col p-4 lg:sticky lg:top-20 lg:h-[80vh] h-[500px] lg:min-h-[500px]">
          <div className="flex-1 w-full h-full relative flex items-center justify-center bg-[#050505] custom-checkerboard rounded-2xl border border-white/5 overflow-hidden">
            {!uploadedImage ? (
              <div
                className="text-center cursor-pointer p-12 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconPhoto className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300">No Image Selected</h3>
                <p className="text-sm text-gray-500 mt-2">Upload an image to start editing</p>
              </div>
            ) : (
              enhancedImage ? (
                <ComparisonView
                  original={uploadedImage}
                  enhanced={enhancedImage}
                  onDownload={handleDownload}
                  onExpand={() => setIsExpandViewOpen(true)}
                />
              ) : (
                <div className="relative w-full h-full">
                  <img src={uploadedImage} className="w-full h-full object-contain opacity-50 blur-sm" alt="Preview" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/80 backdrop-blur px-6 py-3 rounded-full border border-white/10 text-gray-300 text-sm">
                      Click enhance to process
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* STATUS BAR */}
          <div className="mt-4 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-wider">
            <div>
              {uploadedImage && <span>Source: {imageMetadata.width}×{imageMetadata.height} • PNG</span>}
            </div>
            <div>
              Sharpii Engine v2.0
            </div>
          </div>


          {/* MODES SECTION - Right Side Below Output */}
          <div className="mt-4 px-4 pb-8 w-full">
            <h3 className="text-xs font-bold text-white/50 mb-3 flex items-center gap-2 uppercase tracking-wide">
              Select Mode
            </h3>
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
              {[
                { id: 'Subtle', label: 'Subtle' },
                { id: 'Clear', label: 'Clear' },
                { id: 'Pimples', label: 'Pimples' },
                { id: 'Freckles', label: 'Freckles' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setEnhancementMode(mode.id)}
                  className={cn(
                    "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                    enhancementMode === mode.id
                      ? "bg-[#FFFF00] text-black shadow-[0_0_15px_rgba(255,255,0,0.2)]"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expand View Modal */}
      {
        enhancedImage && uploadedImage && (
          <ExpandViewModal
            isOpen={isExpandViewOpen}
            onClose={() => setIsExpandViewOpen(false)}
            originalImage={uploadedImage}
            enhancedImage={enhancedImage}
            onDownload={handleDownload}
          />
        )
      }
    </div >
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<ElegantLoading message="Initializing Editor..." />}>
      <EditorContent />
    </Suspense>
  )
}