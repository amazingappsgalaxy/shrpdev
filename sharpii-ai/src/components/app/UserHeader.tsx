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
        { name: 'History', href: '/app/history', icon: BarChart3 },
        { name: 'Image Editor', href: '/app/image-editor', icon: Wand2 },
        { name: 'Generate', href: '/app/generate-image', icon: ImageIcon },
    ]

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-[9999] ${className || ''}`}>
                <nav className="w-full bg-[#09090b]/90 border-b border-white/5 px-4 py-3 shadow-sm backdrop-blur-xl md:px-6 md:py-3 relative transition-all duration-300">
                    <div className="flex items-center justify-between gap-4">

                        {/* 1. Brand Logo */}
                        <div className="flex items-center flex-shrink-0 min-w-[140px]">
                            <Link href="/" className="flex items-center gap-1 group">
                                <MainLogo />
                            </Link>
                        </div>

                        {/* 2. Desktop Navigation - Centered in Flex flow */}
                        <div className="hidden xl:flex items-center flex-1 justify-center">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 shadow-inner backdrop-blur-sm">
                                {navigationItems.map((item) => {
                                    const isActiveLink = isActive(item.href)
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isActiveLink
                                                ? 'text-black'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {isActiveLink && (
                                                <motion.div
                                                    layoutId="nav-pill"
                                                    className="absolute inset-0 bg-[#FFFF00] rounded-full shadow-[0_0_15px_rgba(255,255,0,0.4)]"
                                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center gap-1.5">
                                                <Icon className={`w-3.5 h-3.5 ${isActiveLink ? 'text-black' : ''}`} />
                                                {item.name}
                                            </span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>

                        {/* 3. Right Side Actions */}
                        <div className="flex items-center justify-end gap-3 flex-shrink-0 min-w-[140px]">

                            {/* Credits Badge */}
                            <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 gap-2 shadow-sm whitespace-nowrap">
                                <Coins className="w-3.5 h-3.5 text-[#FFFF00]" />
                                <span className="text-sm font-medium text-white numerical-font">
                                    {creditsLoading ? '...' : credits.toLocaleString()}
                                </span>
                            </div>

                            {/* Upgrade Button - Compact version for header */}
                            <button
                                onClick={() => setIsPlansPopupOpen(true)}
                                className="hidden sm:flex items-center gap-1.5 bg-[#FFFF00] hover:bg-[#e6e600] text-black px-4 py-1.5 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(255,255,0,0.3)] hover:shadow-[0_0_25px_rgba(255,255,0,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
                            >
                                <Crown className="w-3.5 h-3.5 fill-black" />
                                <span>Upgrade</span>
                            </button>

                            {/* Profile Dropdown */}
                            <div className="relative group/profile">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className={`flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-xl transition-all duration-300 border ${isProfileMenuOpen
                                        ? 'bg-white/10 border-white/20'
                                        : 'bg-transparent border-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
                                        <span className="text-xs font-bold text-white">{username.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180 text-white' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 top-full mt-2 w-64 glass-premium rounded-xl overflow-hidden z-50 p-1 shadow-2xl border border-white/10"
                                        >
                                            <div className="px-3 py-3 border-b border-white/5 mb-1 bg-white/5 rounded-t-lg">
                                                <p className="text-sm font-bold text-white">{username}</p>
                                                <p className="text-xs text-white/50 truncate font-medium">{user?.email}</p>
                                            </div>

                                            <div className="space-y-0.5 mt-1">
                                                {userMenuItems.map((item) => (
                                                    <Link href={item.href} key={item.name} onClick={() => setIsProfileMenuOpen(false)}>
                                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white/70 hover:text-white transition-colors">
                                                            <item.icon className="w-4 h-4 opacity-70" />
                                                            {item.name}
                                                        </div>
                                                    </Link>
                                                ))}

                                                <div className="my-1 h-px bg-white/5 mx-2" />

                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4 opacity-70" />
                                                    Sign Out
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
                    </div>
                </nav>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-4 right-4 top-full mt-2 z-50 lg:hidden"
                        >
                            <div className="glass-premium rounded-2xl border border-white/10 p-4 shadow-2xl overflow-hidden">
                                <div className="space-y-2">
                                    {navigationItems.map((item) => {
                                        const isActiveLink = isActive(item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActiveLink
                                                    ? 'bg-[#FFFF00]/10 text-[#FFFF00] border border-[#FFFF00]/20 font-bold'
                                                    : 'bg-white/5 text-white/70 border border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.name}</span>
                                            </Link>
                                        )
                                    })}

                                    <div className="h-px bg-white/10 my-3" />

                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                        <span className="text-white/60 text-sm">Credits</span>
                                        <div className="flex items-center gap-2">
                                            <Coins className="w-4 h-4 text-[#FFFF00]" />
                                            <span className="font-bold text-white">{creditsLoading ? '...' : credits.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsPlansPopupOpen(true);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full btn-premium flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Crown className="w-4 h-4 fill-black" />
                                        <span>Upgrade Plan</span>
                                    </button>
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
