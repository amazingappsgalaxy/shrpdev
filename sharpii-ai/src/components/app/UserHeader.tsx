'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, signOut as simpleSignOut } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { MainLogo } from '@/components/ui/main-logo'
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
              <MainLogo />
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
            <div className="relative group/profile">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`flex items-center gap-3 p-1.5 pr-4 rounded-full transition-all duration-300 border ${isProfileMenuOpen
                    ? 'bg-white/10 border-[#FFFF00]/50 shadow-[0_0_15px_rgba(255,255,0,0.1)]'
                    : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20'
                  }`}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center border border-white/10 shadow-inner group-hover/profile:border-[#FFFF00]/50 transition-colors">
                    <span className="text-sm font-bold text-white group-hover/profile:text-[#FFFF00] transition-colors">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                </div>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-bold text-white leading-none mb-1 group-hover/profile:text-[#FFFF00] transition-colors">
                    {username}
                  </span>
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider leading-none">
                    Creator
                  </span>
                </div>

                <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-300 group-hover/profile:text-white ${isProfileMenuOpen ? 'rotate-180 text-[#FFFF00]' : ''}`} />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-3 w-72 bg-[#050505]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-50 ring-1 ring-white/5"
                  >
                    {/* Header with decorative glow */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#FFFF00]/5 to-transparent pointer-events-none" />

                    <div className="p-5 relative z-10">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center shadow-lg">
                          <span className="text-xl font-bold text-white">{username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-white font-bold text-lg truncate">{username}</h4>
                          <p className="text-white/40 text-xs truncate font-medium">{user?.email}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {userMenuItems.map((item) => (
                          <Link href={item.href} key={item.name} onClick={() => setIsProfileMenuOpen(false)}>
                            <div className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/5">
                              <div className="p-2 rounded-lg bg-white/5 text-white/60 group-hover:text-[#FFFF00] group-hover:bg-[#FFFF00]/10 transition-colors">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                                {item.name}
                              </span>
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                <ChevronDown className="w-4 h-4 text-[#FFFF00] -rotate-90" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 group transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-red-400 group-hover:bg-red-500/10 transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white/60 group-hover:text-red-400 transition-colors">Sign Out</span>
                        </div>
                      </button>
                    </div>
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