'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  Zap
} from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { MyPricingPlans2 } from '@/components/ui/mypricingplans2'

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
-      await simpleSignOut()
+      await simpleSignOut()
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
    { name: 'Dashboard', href: '/app/dashboard' },
    { name: 'Editor', href: '/app/editor' },
    { name: 'Workspace', href: '/app/workspace' },
  ]

  return (
    <>
      {/* Main Header - Static, no animations */}
      <header className={`fixed top-0 w-full z-50 ${className}`}>
        {/* Dark Black Glassmorphism Background */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl border-b border-white/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/20 via-black/30 to-gray-800/20" />
        
        <nav className="relative container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center border border-white/10">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Sharpii.ai
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - Cupertino Segmented Control */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-1">
                {navigationItems.map((item) => {
                  const isActiveLink = isActive(item.href)
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActiveLink 
                          ? 'bg-white/20 text-white shadow-sm' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Plans Button */}
              <Button 
                variant="ghost" 
                onClick={() => setIsPlansPopupOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 h-9 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-white text-sm font-medium backdrop-blur-sm transition-colors"
              >
                <Crown className="w-4 h-4 text-purple-300" />
                <span>Plans</span>
              </Button>

              {/* Profile Menu - No animation */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center border border-white/10">
                    <User className="w-4 h-4 text-white/90" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-white/90">{username}</span>
                  <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown - No animation */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3">
                      {/* Credits Display */}
                      <div className="mb-3 p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-4 h-4 text-purple-300" />
                            <span className="text-sm font-medium text-white/90">Credits</span>
                          </div>
                          <span className="text-sm font-bold text-white">
                            {creditsLoading ? '...' : credits.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* User Menu Items */}
                      {userMenuItems.map((item) => {
                        const Icon = item.icon
                        const isActiveLink = isActive(item.href)
                        return (
                          <Link href={item.href} key={item.name}>
                            <button
                              onClick={() => setIsProfileMenuOpen(false)}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                                isActiveLink 
                                  ? 'bg-white/10 border border-white/20' 
                                  : 'hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${
                                isActiveLink 
                                  ? 'text-white' 
                                  : 'text-white/60'
                              }`} />
                              <span className={`text-sm font-medium ${
                                isActiveLink 
                                  ? 'text-white' 
                                  : 'text-white/80'
                              }`}>
                                {item.name}
                              </span>
                            </button>
                          </Link>
                        )
                      })}
                      
                      {/* Divider */}
                      <div className="my-3 h-px bg-white/10" />
                      
                      {/* Logout Button */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                      >
                        <LogOut className="w-5 h-5 text-red-400" />
                        <span className="text-sm font-medium text-red-400">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button - No animation */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-9 h-9 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-center transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white/70" />
                ) : (
                  <Menu className="w-5 h-5 text-white/70" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu - No animation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-2xl">
            <div className="container mx-auto px-6 py-4 space-y-2">
              {navigationItems.map((item) => {
                const isActiveLink = isActive(item.href)
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        isActiveLink ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isActiveLink ? 'text-white' : 'text-white/80'}`}>{item.name}</span>
                    </button>
                  </Link>
                )
              })}

              {/* Credits in Mobile Menu */}
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-purple-300" />
                    <span className="text-sm font-medium text-white/90">Credits</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {creditsLoading ? '...' : credits.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Full-Screen Plans Popup with MyPricingPlans */}
      {isPlansPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl">
          {/* Close Button */}
          <div className="absolute top-6 right-6 z-60">
            <button
              onClick={() => setIsPlansPopupOpen(false)}
              className="p-3 hover:bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm transition-colors"
            >
              <X className="w-6 h-6 text-white/70" />
            </button>
          </div>

          {/* Full-Screen Content */}
          <div className="h-full overflow-y-auto">
            <div className="min-h-full flex items-center justify-center py-16 px-6">
              <div className="w-full max-w-7xl">
                <MyPricingPlans2
                  showHeader={true}
                  title="Choose Your Perfect Plan"
                  subtitle="Transform your images with professional AI enhancement. Start with any plan."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserHeader