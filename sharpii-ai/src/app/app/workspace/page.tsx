'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import UserHeader from '@/components/app/UserHeader'
import { ElegantLoading } from '@/components/ui/elegant-loading'
import TaskInfoModal from '@/components/app/workspace/TaskInfoModal'
import { Info, Download, Calendar, Settings, Image as ImageIcon, RefreshCw } from 'lucide-react'

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

export default function WorkspacePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    console.log('Auth state:', { isLoading, user: !!user })
    if (!isLoading) {
      if (user) {
        console.log('User authenticated, loading tasks')
        loadTasks()
      } else {
        console.log('No user, stopping task loading')
        setLoadingTasks(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user])

  // Smart polling for real-time updates
  useEffect(() => {
    if (!user || loadingTasks) return

    const hasProcessingTasks = tasks.some(task => task.status === 'processing' || task.status === 'pending')

    if (!hasProcessingTasks) return

    const pollInterval = setInterval(() => {
      setIsPolling(true)
      loadTasks(true) // Silent refresh
    }, 3000) // Poll every 3 seconds when there are processing tasks

    return () => clearInterval(pollInterval)
  }, [user, tasks, loadingTasks])

  const loadTasks = async (silent = false) => {
    try {
      if (!silent) {
        console.log('Loading tasks...')
      }
      const res = await fetch('/api/tasks/list?limit=20', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!silent) {
        console.log('Tasks API response:', res.status)
      }
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Tasks API error:', errorData)
        throw new Error(`Failed to load tasks: ${res.status}`)
      }
      const data = await res.json()
      if (!silent) {
        console.log('Tasks data received:', data)
      }
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Workspace: failed to load tasks', err)
      setTasks([])
    } finally {
      setLoadingTasks(false)
      setIsPolling(false)
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Workspace</h1>
              <p className="text-white/60">Your image enhancement results and history</p>
            </div>
            <button
              onClick={() => {
                setLoadingTasks(true)
                loadTasks()
              }}
              disabled={loadingTasks}
              className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-white/20 backdrop-blur-md transition-all duration-200"
              title={isPolling ? "Auto-refreshing..." : "Refresh tasks"}
            >
              <RefreshCw className={`w-5 h-5 ${loadingTasks || isPolling ? 'animate-spin' : ''}`} />
            </button>
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
                  className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  onClick={() => handleTaskInfo(task)}
                >
                  {/* Image Display */}
                  <div className="relative aspect-square bg-white/5">
                    {task.enhancedImageUrl || task.originalImageUrl ? (
                      <img
                        src={task.enhancedImageUrl || task.originalImageUrl!}
                        alt="Enhancement result"
                        className={`w-full h-full object-cover ${
                          task.status === 'processing' ? 'blur-sm' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-white/30" />
                      </div>
                    )}

                    {/* Loading indicator for processing tasks */}
                    {task.status === 'processing' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}

                    {/* Status badge with glassmorphism */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90">
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
                    <div className="space-y-2 text-sm text-white/60">
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      {task.enhancedImageUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(task.enhancedImageUrl!, `enhanced_${task.id}.jpg`)
                          }}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
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