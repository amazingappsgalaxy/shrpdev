'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import UserHeader from '@/components/app/UserHeader'
import { ElegantLoading } from '@/components/ui/elegant-loading'

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
          <h1 className="text-2xl font-bold mb-4">Workspace</h1>
          <p className="text-white/60 mb-8">View your recent enhancement tasks</p>

          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            {loadingTasks ? (
              <p className="text-white/70">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="text-white/70">
                <p>No tasks yet.</p>
                <p className="text-white/40 text-sm mt-1">Create a new enhancement from the Editor.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {tasks.map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center">
                        {t.enhancedImageUrl || t.originalImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(t.enhancedImageUrl || t.originalImageUrl)!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white/60 text-sm">IMG</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{t.modelName || 'Task'}</p>
                        <p className="text-white/50 text-xs">{new Date(t.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm capitalize">{t.status}</p>
                      <p className="text-white/50 text-xs">{t.progress ?? 0}%</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}