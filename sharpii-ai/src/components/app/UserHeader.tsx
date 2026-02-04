'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, signOut as simpleSignOut } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import {
  Sparkles,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Home,
  CreditCard,
  Crown,
  ChevronDown,
  BarChart3,
  Coins,
  Check,
  Star,
  Zap,
  LayoutDashboard,
  Wand2,
  Image as ImageIcon,
  Palette
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { MyPricingPlans2 } from '@/components/ui/mypricingplans2'
import { motion, AnimatePresence } from 'framer-motion'

interface UserHeaderProps {
  className?: string
}

export function UserHeader({ className }: UserHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isPlansPopupOpen, setIsPlansPopupOpen] = useState(false)
  const { user: currentUser } = useAuth()

  // Using user directly from simple auth client
  const userLoading = false

  // Get user credits
  const [credits, setCredits] = useState(0)
  const [creditsLoading, setCreditsLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      if (currentUser?.id) {
        try {
          setCreditsLoading(true)
          const balance = await UnifiedCreditsService.getUserCredits(currentUser.id)
          setCredits(balance.remaining)
        } catch (error) {
          console.error('Error fetching credits:', error)
          setCredits(0)
        } finally {
          setCreditsLoading(false)
        }
      }
    }

    fetchCredits()

    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
  }, [currentUser?.id])

  const user = currentUser
  const username = user?.name || user?.email?.split('@')[0] || 'User'

  const handleSignOut = async () => {
    try {
      await simpleSignOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  const userMenuItems = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Subscriptions', href: '/app/subscriptions', icon: CreditCard },
  ]

  const navigationItems = [
    { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Editor', href: '/app/editor', icon: Palette },
    { name: 'Image Editor', href: '/app/image-editor', icon: Wand2 },
    { name: 'Generate', href: '/app/generate-image', icon: ImageIcon },
  ]

  return (
    <>
      {/* Main Header */}
      <header className={`fixed top-0 w-full z-50 ${className}`}>
        {/* Premium Dark Glass Background */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-b border-white/5" />

        <nav className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* 1. Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1 group">
              <span className="text-2xl font-bold tracking-tight text-white group-hover:text-white/90 transition-colors">Sharpii</span>
              <span className="text-2xl font-bold text-[#FFFF00] drop-shadow-[0_0_8px_rgba(255,255,0,0.5)]">.ai</span>
            </Link>
          </div>

          {/* 2. Desktop Navigation - Segmented Control Style */}
          <div className="hidden lg:flex items-center absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1.5 backdrop-blur-md">
              {navigationItems.map((item) => {
                const isActiveLink = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isActiveLink
                        ? 'text-black'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {isActiveLink && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-[#FFFF00] rounded-full shadow-[0_0_20px_rgba(255,255,0,0.3)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isActiveLink ? 'text-black' : ''}`} />
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 3. Right Side Actions */}
          <div className="flex items-center gap-4">

            {/* Credits Badge (Visible on Desktop) */}
            <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 gap-2">
              <Coins className="w-3.5 h-3.5 text-[#FFFF00]" />
              <span className="text-sm font-medium text-white">
                {creditsLoading ? '...' : credits.toLocaleString()}
              </span>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={() => setIsPlansPopupOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFF00]/10 hover:bg-[#FFFF00]/20 border border-[#FFFF00]/20 text-[#FFFF00] text-sm font-bold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,0,0.2)]"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center border border-white/10 shadow-inner">
                  <span className="text-xs font-bold text-white">{username.charAt(0).toUpperCase()}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                      <p className="text-sm font-medium text-white">{username}</p>
                      <p className="text-xs text-white/40 truncate">{user?.email}</p>
                    </div>

                    {userMenuItems.map((item) => (
                      <Link href={item.href} key={item.name} onClick={() => setIsProfileMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-white/80 hover:text-white transition-colors">
                          <item.icon className="w-4 h-4 opacity-70" />
                          {item.name}
                        </div>
                      </Link>
                    ))}

                    <div className="h-px bg-white/5 my-2" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4 opacity-70" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 text-white/70 hover:text-white border border-white/10"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-black/95 border-b border-white/10 overflow-hidden"
            >
              <div className="px-6 py-6 space-y-4">
                {navigationItems.map((item) => {
                  const isActiveLink = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActiveLink
                          ? 'bg-[#FFFF00]/10 text-[#FFFF00] border border-[#FFFF00]/20'
                          : 'bg-white/5 text-white/70 border border-white/5'
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}

                <div className="h-px bg-white/10 my-4" />

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-[#FFFF00]" />
                    <span className="text-white/80">Credits</span>
                  </div>
                  <span className="font-bold text-white">{creditsLoading ? '...' : credits.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Plans Popup */}
      <AnimatePresence>
        {isPlansPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsPlansPopupOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-7xl h-full overflow-y-auto pt-10">
              <MyPricingPlans2
                showHeader={true}
                title="Unlock Professional Power"
                subtitle="Choose the plan that fits your creative workflow."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default UserHeader