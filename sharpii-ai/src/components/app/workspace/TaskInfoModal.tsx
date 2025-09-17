'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react'

interface TaskItem {
  id: string
  status: string
  progress: number
  originalImageUrl?: string | null
  enhancedImageUrl?: string | null
  modelName?: string | null
  provider?: string | null
  createdAt: string
  creditsConsumed?: number | null
}

interface TaskInfoModalProps {
  task: TaskItem | null
  isOpen: boolean
  onClose: () => void
}

export default function TaskInfoModal({ task, isOpen, onClose }: TaskInfoModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const displayImage = task?.enhancedImageUrl || task?.originalImageUrl

  // Detect image resolution when modal opens
  useEffect(() => {
    if (isOpen && displayImage) {
      const img = new Image()
      img.onload = () => {
        setImageResolution({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = displayImage
    } else {
      setImageResolution(null)
    }
  }, [isOpen, displayImage])

  if (!task) return null

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 4))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleReset = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel(prev => Math.min(Math.max(prev * delta, 0.5), 4))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }



  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-full flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side - Image Display */}
            <div className="flex-1 relative bg-black/60 backdrop-blur-2xl border-r border-white/10">
              {displayImage ? (
                <div
                  ref={imageContainerRef}
                  className="w-full h-full relative overflow-hidden"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                  }}
                >
                  <img
                    src={displayImage}
                    alt="Enhanced result"
                    className="w-full h-full object-contain"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                      transformOrigin: 'center center'
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white/50">No image available</p>
                </div>
              )}

              {/* Zoom Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="text-white text-sm min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 4}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="w-px h-6 bg-white/20 mx-1" />

                  <button
                    onClick={handleReset}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Reset zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Download Button */}
              {task.enhancedImageUrl && (
                <div className="absolute top-6 right-6">
                  <button
                    onClick={() => handleDownload(task.enhancedImageUrl!, `enhanced_${task.id}.jpg`)}
                    className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
                    title="Download Image"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Side - Information Panel */}
            <div className="w-80 bg-white/5 backdrop-blur-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-white">Details</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Task Overview */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Task Overview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span className="text-white capitalize">{task.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Progress</span>
                      <span className="text-white">{task.progress || 0}%</span>
                    </div>
                    {task.status === 'processing' && (
                      <div className="mt-2">
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="bg-white h-full rounded-full transition-all duration-300"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">Task ID</span>
                      <span className="text-white/80 text-xs font-mono">{task.id.slice(-8)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Model Information */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">AI Model Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Model Name</span>
                      <span className="text-white">{task.modelName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Provider</span>
                      <span className="text-white">{task.provider || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                {/* Output Image Resolution */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Output Image</h3>
                  <div className="space-y-2 text-sm">
                    {imageResolution ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-white/60">Resolution</span>
                          <span className="text-white">{imageResolution.width} × {imageResolution.height}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Megapixels</span>
                          <span className="text-white">{((imageResolution.width * imageResolution.height) / 1000000).toFixed(1)} MP</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-white/60">Resolution</span>
                        <span className="text-white/50">Loading...</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span className="text-white">{task.enhancedImageUrl ? 'Available' : 'Processing...'}</span>
                    </div>
                  </div>
                </div>

                {/* Credits Used */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Credits</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Credits Used</span>
                      <span className="text-white">
                        {task.creditsConsumed !== null && task.creditsConsumed !== undefined
                          ? `${task.creditsConsumed} credits`
                          : 'Not available'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Billing</span>
                      <span className="text-white">
                        {task.status === 'completed' && task.creditsConsumed
                          ? 'Charged'
                          : task.status === 'failed'
                            ? 'Not charged'
                            : 'Pending'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Created</span>
                      <span className="text-white">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Time</span>
                      <span className="text-white">{new Date(task.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Time Elapsed</span>
                      <span className="text-white">
                        {Math.round((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60))} min ago
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Technical Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-white/60">Full Task ID</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(task.id)}
                        className="text-white/80 text-xs font-mono hover:text-white transition-colors cursor-pointer text-right max-w-[200px] break-all"
                        title="Click to copy"
                      >
                        {task.id}
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Processing Type</span>
                      <span className="text-white">AI Enhancement</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Queue Priority</span>
                      <span className="text-white">Standard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-white/10">
                <div className="space-y-3">
                  {task.enhancedImageUrl && (
                    <button
                      onClick={() => handleDownload(task.enhancedImageUrl!, `enhanced_${task.id}.jpg`)}
                      className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Result
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}