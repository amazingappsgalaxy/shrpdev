"use client"

import React, { useState, useRef } from "react"
import { motion } from "framer-motion"
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
  Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client-simple"
import UserHeader from "@/components/app/UserHeader"
import { ElegantLoading } from "@/components/ui/elegant-loading"

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

export default function EditorPage() {
  const { user, isLoading } = useAuth()

  // Core state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
  const [enhancementType, setEnhancementType] = useState<'face' | 'body'>('face')
  const [enhancementMode, setEnhancementMode] = useState<'standard' | 'detailed' | 'heavy'>('standard')
  const [skinTextureAdjuster, setSkinTextureAdjuster] = useState(0.37)
  const [skinReductionLevel, setSkinReductionLevel] = useState(1.7)
  const [bestPracticesAccepted, setBestPracticesAccepted] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 960, height: 1280 })
  const [areaProtection, setAreaProtection] = useState<AreaProtectionSettings>(DEFAULT_AREA_PROTECTION)

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

  const handleEnhancement = async () => {
    if (!uploadedImage || !user || !bestPracticesAccepted) return

    // Simulate enhancement
    await new Promise(resolve => setTimeout(resolve, 2000))
    setEnhancedImage(uploadedImage)
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <UserHeader />

      <div className="max-w-7xl mx-auto relative pt-24 px-4 sm:px-6 lg:px-8">
        {/* Top Banners */}
        <div className="relative mb-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-1.5 sm:gap-2 lg:gap-4">
            <div className="relative flex-1 flex items-center justify-between px-2 sm:px-4 py-1 sm:py-2 rounded-md shadow-lg bg-gradient-to-r from-blue-900/80 to-indigo-900/80 border-2 border-blue-500/50 hover:border-blue-400/70 transition-all duration-300 animate-pulse">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                <span className="bg-blue-500 sm:text-xs text-[10px] px-2 py-0.5 rounded font-bold text-white animate-pulse">Hot</span>
                <span className="font-bold text-[10px] lg:text-[10px] xl:text-sm text-white drop-shadow-sm">New AI Enhancement Available. <span className="font-bold underline cursor-pointer hover:text-blue-300 transition-colors duration-200 text-blue-200">Try it now</span>.</span>
              </div>
              <button className="absolute top-1 right-1 p-1 rounded hover:bg-blue-600/30 transition-colors duration-200" aria-label="Close banner">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-between px-2 sm:px-4 py-1 sm:py-2 rounded-md shadow-lg bg-gradient-to-r from-emerald-900/80 to-green-900/80 border-2 border-emerald-500/50 hover:border-emerald-400/70 transition-all duration-300 animate-pulse">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                <span className="bg-emerald-500 sm:text-xs text-[10px] px-2 py-0.5 rounded font-bold text-white animate-pulse">New</span>
                <span className="font-bold text-[10px] lg:text-[10px] xl:text-sm text-white drop-shadow-sm">Pro Mode is now live! <span className="font-bold underline cursor-pointer hover:text-emerald-300 transition-colors duration-200 text-emerald-200">Try it now</span></span>
              </div>
              <button className="absolute top-1 right-1 p-1 rounded hover:bg-emerald-600/30 transition-colors duration-200" aria-label="Close banner">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

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
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-medium text-gray-300">Enhancement Type</h3>
                        <div className="space-y-1">
                          <button
                            onClick={() => setEnhancementType('face')}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                              enhancementType === 'face'
                                ? "bg-blue-600 text-white"
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
                                ? "bg-blue-600 text-white"
                                : "bg-[#151515] text-gray-400 hover:text-white border border-[#282828] hover:border-blue-500/50 hover:bg-[#1c1c1e]"
                            )}
                          >
                            Body
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative group mt-2">
                    <a className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors bg-[#1c1c1e] text-blue-400 hover:bg-[#282828] opacity-50 cursor-not-allowed" href="#">
                      <Crop className="w-3 h-3" />
                      Use Photo Resizer to crop & resize
                    </a>

                    <div className="mt-2">
                      <div className="flex items-center justify-between relative group">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-medium text-gray-200">Face Detection & Cropping</h3>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300">Recommended</span>
                        </div>
                        <div>
                          <button disabled className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors duration-200 opacity-50 cursor-not-allowed bg-blue-600 text-white">
                            <Crop className="w-3 h-3" />
                            <span className="text-xs font-medium">Crop</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs mt-1 text-gray-400">Upgrade to Creator or Professional to access face detection and cropping features</p>
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
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
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
                          <span className="text-xs font-medium text-gray-300">Cost: 100.00 Credits</span>
                        </div>
                        <div className="text-[10px] font-medium text-gray-400">{imageSize.width} × {imageSize.height} px</div>
                      </div>

                      <div className="flex items-center gap-2 py-5">
                        <input
                          type="checkbox"
                          id="best-practices"
                          className="w-4 h-4 rounded bg-[#1c1c1e] border-[#282828] text-blue-500"
                          checked={bestPracticesAccepted}
                          onChange={(e) => setBestPracticesAccepted(e.target.checked)}
                        />
                        <label htmlFor="best-practices" className="text-xs text-gray-400">
                          Yes, I have read the <button type="button" className="underline text-blue-400">best practices</button>
                        </label>
                      </div>

                      <div className="relative overflow-hidden rounded-xl shadow-lg border border-blue-400/40">
                        <button
                          onClick={handleEnhancement}
                          disabled={!uploadedImage || !bestPracticesAccepted}
                          className="w-full px-8 py-2.5 text-base font-bold rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Enhance {enhancementType === 'face' ? 'Face' : 'Body'}
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
                          <div className="relative w-full h-full">
                            <img src={enhancedImage} alt="Enhanced" className="w-full h-full object-contain" />
                            <div className="absolute bottom-4 right-4 flex space-x-2">
                              <button className="p-2 rounded-full transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-4 left-4 text-sm font-light text-gray-400 bg-[#1c1c1e]/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                              Enhancement complete
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
    </div>
  )
}