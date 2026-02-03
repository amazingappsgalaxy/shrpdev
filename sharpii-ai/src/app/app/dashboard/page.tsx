'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import UserHeader from '@/components/app/UserHeader'
import CreditsSection from '@/components/app/dashboard/CreditsSection'
import OptimizedUsageSection from '@/components/app/dashboard/OptimizedUsageSection'
import BillingSection from '@/components/app/dashboard/BillingSection'
import { ElegantLoading } from '@/components/ui/elegant-loading'
import {
  Menu,
  X
} from 'lucide-react'

import { Suspense } from 'react'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const [activeSection, setActiveSection] = useState('credits')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const menuItems = [
    {
      id: 'credits',
      label: 'Credits'
    },
    {
      id: 'usage',
      label: 'Usage'
    },
    {
      id: 'billing',
      label: 'Billing'
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'credits':
        return <CreditsSection />
      case 'usage':
        return <OptimizedUsageSection />
      case 'billing':
        return <BillingSection />
      default:
        return <CreditsSection />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Pass effective user to header if needed, but UserHeader likely uses useAuth internally. 
          If UserHeader uses useAuth, it will show 'Sign In' or empty. 
          Ideally we update UserHeader too, but for now we focus on access. 
      */}
      <UserHeader />

      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {isDemo && (
            <div className="mb-6 p-4 rounded-lg bg-[hsl(var(--accent-neon))]/10 border border-[hsl(var(--accent-neon))]/20 text-[hsl(var(--accent-neon))] text-sm">
              ⚠️ You are in <strong>Demo Mode</strong>. Changes will not be saved.
            </div>
          )}

          {/* Mobile Menu Button - Minimal */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <div className="flex gap-8 lg:gap-12">
            {/* Left Sidebar - Minimal Design */}
            <aside className={`
              fixed inset-0 bg-black/95 backdrop-blur-xl z-40 lg:bg-white/[0.02] lg:backdrop-blur-none lg:border-r lg:border-white/10
              lg:relative lg:w-64 transform transition-all duration-300 ease-in-out
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              pt-24 lg:pt-0 lg:rounded-lg
            `}>
              <div className="px-4 lg:px-4 lg:py-6 h-full">
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-lg font-medium text-white mb-1">Dashboard</h1>
                  <p className="text-white/40 text-xs">Manage your account</p>
                </div>

                {/* Menu Items - Minimal Design */}
                <nav className="space-y-0.5">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`
                        w-full text-left px-3 py-2.5 text-sm transition-colors duration-150
                        ${activeSection === item.id
                          ? 'text-white font-medium'
                          : 'text-white/50 hover:text-white/80'
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
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