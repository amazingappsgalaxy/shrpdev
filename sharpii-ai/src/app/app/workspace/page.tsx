'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import UserHeader from '@/components/app/UserHeader'
import { ElegantLoading } from '@/components/ui/elegant-loading'
import TaskInfoModal from '@/components/app/workspace/TaskInfoModal'
import { Info, Download, Calendar, Settings, Image as ImageIcon } from 'lucide-react'

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

export default function WorkspacePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      loadTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user])

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks/list?limit=20', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Workspace: failed to load tasks', err)
      setTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleTaskInfo = (task: TaskItem) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

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

  if (isLoading) {
    return <ElegantLoading message="Loading workspace..." />
  }

  if (!user) {
    router.push('/app/login')
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <UserHeader />
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Workspace</h1>
            <p className="text-white/60">Your image enhancement results and history</p>
          </div>

          {loadingTasks ? (
            <div className="flex items-center justify-center py-20">
              <ElegantLoading message="Loading your workspace..." />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h2 className="text-xl font-semibold text-white/80 mb-2">No enhancements yet</h2>
              <p className="text-white/50 mb-6">Start creating amazing image enhancements from the Editor</p>
              <button
                onClick={() => router.push('/app/editor')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all"
              >
                Go to Editor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                >
                  {/* Image Display */}
                  <div className="relative aspect-square bg-white/5">
                    {task.enhancedImageUrl || task.originalImageUrl ? (
                      <img
                        src={task.enhancedImageUrl || task.originalImageUrl!}
                        alt="Enhancement result"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-white/30" />
                      </div>
                    )}

                    {/* Overlay with action buttons */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleTaskInfo(task)}
                        className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                        title="View Details"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                      {task.enhancedImageUrl && (
                        <button
                          onClick={() => handleDownload(task.enhancedImageUrl!, `enhanced_${task.id}.jpg`)}
                          className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                          title="Download Image"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'completed'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : task.status === 'processing'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : task.status === 'failed'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    {/* Progress bar for processing tasks */}
                    {task.status === 'processing' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <div className="flex items-center gap-2 text-xs text-white">
                          <div className="flex-1 bg-white/20 rounded-full h-1">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                          <span>{task.progress || 0}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white truncate">
                        {task.modelName || 'Enhancement Task'}
                      </h3>
                      <button
                        onClick={() => handleTaskInfo(task)}
                        className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0 ml-2"
                      >
                        <Info className="w-4 h-4 text-white/60" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm text-white/60">
                      {task.provider && (
                        <p className="flex items-center gap-1">
                          <Settings className="w-3 h-3" />
                          {task.provider}
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleTaskInfo(task)}
                        className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                      >
                        View Details
                      </button>
                      {task.enhancedImageUrl && (
                        <button
                          onClick={() => handleDownload(task.enhancedImageUrl!, `enhanced_${task.id}.jpg`)}
                          className="py-2 px-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Info Modal */}
      <TaskInfoModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}