'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import UserHeader from '@/components/app/UserHeader'
import { ElegantLoading } from '@/components/ui/elegant-loading'

export default function EditorPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <ElegantLoading message="Loading editor..." />
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
          <h1 className="text-2xl font-bold mb-4">Editor</h1>
          <p className="text-white/60 mb-8">This is the editor area. We can wire up tools and canvas here.</p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-3 bg-white/5 rounded-xl border border-white/10 p-4">
              <h2 className="text-lg font-semibold mb-3">Tools</h2>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="hover:text-white">Enhance</li>
                <li className="hover:text-white">Upscale</li>
                <li className="hover:text-white">Color</li>
              </ul>
            </aside>

            <main className="lg:col-span-9 bg-white/5 rounded-xl border border-white/10 p-6 min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <p className="text-white/70">Editor canvas placeholder</p>
                <p className="text-white/40 text-sm mt-2">Upload an image or select a task from your workspace</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
// --------