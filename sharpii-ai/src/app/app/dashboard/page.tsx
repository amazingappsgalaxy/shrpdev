'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppData } from '@/lib/hooks/use-app-data'
import CreditsSection from '@/components/app/dashboard/CreditsSection'
import OptimizedUsageSection from '@/components/app/dashboard/OptimizedUsageSection'
import BillingSection from '@/components/app/dashboard/BillingSection'
import UserSettingsSection from '@/components/app/dashboard/UserSettingsSection'
import { ElegantLoading } from '@/components/ui/elegant-loading'
import { Suspense } from 'react'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAppData()
  const [activeSection, setActiveSection] = useState('credits')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['credits', 'usage', 'billing', 'settings'].includes(tab)) {
      setActiveSection(tab)
    }
  }, [searchParams])

  if (isLoading) {
    return <ElegantLoading message="Loading your dashboard..." />
  }

  if (!user) {
    router.push('/app/signin')
    return null
  }

  const tabs = [
    { id: 'credits', label: 'Profile' },
    { id: 'usage', label: 'Activity' },
    { id: 'billing', label: 'Billings' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FFFF00] selection:text-black">
      <main className="pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
          </div>

          {/* Segmented Control */}
          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-md p-1 gap-0.5">
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div>
            {activeSection === 'credits' && <CreditsSection />}
            {activeSection === 'usage' && <OptimizedUsageSection />}
            {activeSection === 'billing' && <BillingSection />}
            {activeSection === 'settings' && <UserSettingsSection />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<ElegantLoading message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  )
}
