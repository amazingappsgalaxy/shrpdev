'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client-simple'
import UserHeader from '@/components/app/UserHeader'
import SimpleUsageSection from '@/components/app/dashboard/SimpleUsageSection'
import BillingSection from '@/components/app/dashboard/BillingSection'
import { ElegantLoading } from '@/components/ui/elegant-loading'
import {
  BarChart3,
  CreditCard,
  Menu,
  X
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeSection, setActiveSection] = useState('usage')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (isLoading) {
    return <ElegantLoading message="Loading your dashboard..." />
  }

  if (!user) {
    router.push('/app/login')
    return null
  }

  const menuItems = [
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
      case 'usage':
        return <SimpleUsageSection className="" />
      case 'billing':
        return <BillingSection />
      default:
        return <SimpleUsageSection className="" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <UserHeader />

      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
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
            {/* Left Sidebar - iOS Style */}
            <aside className={`
              fixed inset-0 bg-black/95 backdrop-blur-xl z-40 lg:bg-white/[0.02] lg:backdrop-blur-none lg:border-r lg:border-white/10
              lg:relative lg:w-72 transform transition-all duration-300 ease-in-out
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              pt-24 lg:pt-0 lg:rounded-lg
            `}>
              <div className="px-6 lg:px-6 lg:py-8 h-full">
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-xl font-semibold text-white mb-2">Dashboard</h1>
                  <p className="text-white/40 text-xs">Manage your account</p>
                </div>

                {/* Menu Items - Minimal Text Only */}
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`
                        w-full py-3 px-4 text-left transition-all duration-200 rounded-xl
                        ${activeSection === item.id
                          ? 'bg-white/10 text-white shadow-lg border border-white/20'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <div className={`text-sm font-medium ${activeSection === item.id ? 'text-white' : 'text-white/80'}`}>
                        {item.label}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}

            {/* Right Content */}
            <main className="flex-1 min-h-screen lg:ml-0">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}