'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Settings, Image as ImageIcon, Download } from 'lucide-react'

interface TaskItem {
  id: string
  status: string
  progress: number
  originalImageUrl?: string | null
  enhancedImageUrl?: string | null
  modelName?: string | null
  provider?: string | null
  createdAt: string
}

interface TaskInfoModalProps {
  task: TaskItem | null
  isOpen: boolean
  onClose: () => void
}

export default function TaskInfoModal({ task, isOpen, onClose }: TaskInfoModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Enhancement Details</h2>
              <p className="text-white/60">Task information and results</p>
            </div>

            <div className="space-y-6">
              {/* Status and Progress */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Task Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Status</p>
                    <p className="text-white capitalize font-medium">{task.status}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{task.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Information */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Enhancement Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Model</p>
                    <p className="text-white font-medium">{task.modelName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Provider</p>
                    <p className="text-white font-medium">{task.provider || 'Unknown'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-white/60 text-sm mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created
                  </p>
                  <p className="text-white">{new Date(task.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Image Results */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.originalImageUrl && (
                    <div className="space-y-2">
                      <p className="text-white/80 font-medium">Original Image</p>
                      <div className="relative group">
                        <img
                          src={task.originalImageUrl}
                          alt="Original"
                          className="w-full h-48 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          onClick={() => handleDownload(task.originalImageUrl!, `original_${task.id}.jpg`)}
                          className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {task.enhancedImageUrl && (
                    <div className="space-y-2">
                      <p className="text-white/80 font-medium">Enhanced Image</p>
                      <div className="relative group">
                        <img
                          src={task.enhancedImageUrl}
                          alt="Enhanced"
                          className="w-full h-48 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          onClick={() => handleDownload(task.enhancedImageUrl!, `enhanced_${task.id}.jpg`)}
                          className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Close
                </button>
                {task.enhancedImageUrl && (
                  <button
                    onClick={() => handleDownload(task.enhancedImageUrl!, `enhanced_${task.id}.jpg`)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Result
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}