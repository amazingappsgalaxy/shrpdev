'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import UserHeader from '@/components/app/UserHeader'
import CreditsSection from '@/components/app/dashboard/CreditsSection'
import OptimizedUsageSection from '@/components/app/dashboard/OptimizedUsageSection'
import BillingSection from '@/components/app/dashboard/BillingSection'
import { ElegantLoading } from '@/components/ui/elegant-loading'
import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, CreditCard, Activity, Coins } from 'lucide-react'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const [activeSection, setActiveSection] = useState('credits')

  // Demo mode check
  const isDemo = searchParams.get('demo') === 'true'

  // Read tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['credits', 'usage', 'billing'].includes(tab)) {
      setActiveSection(tab)
    }
  }, [searchParams])

  if (isLoading) {
    return <ElegantLoading message="Loading your dashboard..." />
  }

  // Effective user (real or demo)
  const effectiveUser = user || (isDemo ? {
    id: 'demo-user',
    name: 'Demo Creator',
    email: 'demo@sharpii.ai',
    subscriptionStatus: 'pro',
    apiUsage: 45,
    monthlyApiLimit: 100
  } : null) as typeof user

  if (!effectiveUser) {
    router.push('/app/login')
    return null
  }

  const tabs = [
    { id: 'credits', label: 'Credits & Plans', icon: Coins },
    { id: 'usage', label: 'Usage History', icon: Activity },
    { id: 'billing', label: 'Billing Settings', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FFFF00] selection:text-black">
      <UserHeader />

      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header Area */}
          <div className="space-y-4 text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-white"
            >
              Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/50 max-w-2xl"
            >
              Manage your credits, view usage statistics, and handle your billing details all in one place.
            </motion.p>
          </div>

          {/* Segmented Control Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 md:gap-4 border-b border-white/10 pb-1"
          >
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-t-2xl text-sm font-medium transition-all duration-300 ${isActive
                      ? 'text-[#FFFF00] bg-white/5'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFFF00]' : 'text-current'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBorder"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFFF00] shadow-[0_0_10px_#FFFF00]"
                    />
                  )}
                </button>
              )
            })}
          </motion.div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[500px]"
            >
              {activeSection === 'credits' && <CreditsSection />}
              {activeSection === 'usage' && <OptimizedUsageSection />}
              {activeSection === 'billing' && <BillingSection />}
            </motion.div>
          </AnimatePresence>
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