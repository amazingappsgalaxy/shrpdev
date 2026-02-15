'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, signOut as simpleSignOut } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { MainLogo } from '@/components/ui/main-logo'
import {
    Menu,
    X,
    Home,
    CreditCard,
    Crown,
    ChevronDown,
    LogOut,
    LayoutDashboard,
    Palette,
    BarChart3,
    Wand2,
    Image as ImageIcon,
    Coins
} from 'lucide-react'
import { MyPricingPlans2 } from '@/components/ui/mypricingplans2'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditIcon } from '@/components/ui/CreditIcon'

interface UserHeaderProps {
    className?: string
}

export function UserHeader({ className }: UserHeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isPlansPopupOpen, setIsPlansPopupOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)
    const { user: currentUser } = useAuth()

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

    useEffect(() => {
        if (!isUserMenuOpen) return
        const handleOutsideClick = (event: MouseEvent) => {
            if (!userMenuRef.current) return
            if (!userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [isUserMenuOpen])

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
        { name: 'Dashboard', href: '/app/dashboard' },
        { name: 'Editor', href: '/app/editor' },
        { name: 'History', href: '/app/history' },
        { name: 'Image Editor', href: '/app/image-editor' },
        { name: 'Generate', href: '/app/generate-image' },
    ]

    // Mobile navigation items still need icons
    const mobileNavigationItems = [
        { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
        { name: 'Editor', href: '/app/editor', icon: Palette },
        { name: 'History', href: '/app/history', icon: BarChart3 },
        { name: 'Image Editor', href: '/app/image-editor', icon: Wand2 },
        { name: 'Generate', href: '/app/generate-image', icon: ImageIcon },
    ]

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-[9999] ${className || ''}`}>
                <nav className="w-full bg-[#09090b]/90 border-b border-white/5 px-4 h-16 shadow-sm backdrop-blur-xl md:px-6 relative transition-all duration-300 flex items-center justify-between">

                    {/* 1. Brand Logo */}
                    <div className="flex items-center flex-shrink-0 min-w-[140px]">
                        <Link href="/" className="flex items-center gap-1 group">
                            <MainLogo />
                        </Link>
                    </div>

                    {/* 2. Desktop Navigation - Standard Segmented Control (No Glow, Less Rounded) */}
                    <div className="hidden xl:flex items-center flex-1 justify-center">
                        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md relative h-9">
                            {navigationItems.map((item) => {
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                                relative px-4 h-full flex items-center justify-center rounded text-sm font-medium transition-all duration-200
                                                ${active
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }
                                            `}
                                    >
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* 3. Right Side Actions */}
                    <div className="flex items-center justify-end gap-5 flex-shrink-0 min-w-[140px]">

                        {/* Credits Badge - Minimal (Only Icon + Number) */}
                        <div className="hidden md:flex items-center gap-2 select-none">
                            <CreditIcon className="w-5 h-5 bg-transparent text-[#FFFF00]" iconClassName="w-4 h-4" />
                            <span className="text-sm font-bold text-white numerical-font tabular-nums">
                                {creditsLoading ? '...' : credits.toLocaleString()}
                            </span>
                        </div>

                        {/* Upgrade Button */}
                        <button
                            onClick={() => setIsPlansPopupOpen(true)}
                            className="hidden sm:flex items-center gap-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-all duration-300 transform active:scale-95 whitespace-nowrap"
                        >
                            <Crown className="w-3.5 h-3.5 fill-black" />
                            <span>Upgrade</span>
                        </button>

                        <div className="relative" ref={userMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                                className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-md transition-all duration-200 hover:bg-white/5 outline-none focus:ring-0"
                            >
                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
                                    <span className="text-xs font-bold text-white">{username.charAt(0).toUpperCase()}</span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 min-w-[220px] bg-[#0A0A0B] rounded-lg border border-white/10 shadow-xl p-1.5 z-[10000] animate-in fade-in zoom-in-95 duration-200 slide-in-from-top-2">
                                    <div className="px-2 py-2 mb-1 bg-white/5 rounded-md border border-white/5">
                                        <p className="text-sm font-bold text-white">{username}</p>
                                        <p className="text-xs text-white/50 truncate font-medium mt-0.5">{user?.email}</p>
                                    </div>

                                    {userMenuItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 outline-none cursor-pointer transition-colors"
                                        >
                                            <item.icon className="w-4 h-4 opacity-70" />
                                            {item.name}
                                        </Link>
                                    ))}

                                    <div className="h-px bg-white/5 my-1 mx-1" />

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 outline-none cursor-pointer transition-colors"
                                    >
                                        <LogOut className="w-4 h-4 opacity-70" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>


                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg bg-white/5 text-white/70 hover:text-white border border-white/10"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
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
                            <div className="glass-premium rounded-xl border border-white/10 p-4 shadow-2xl overflow-hidden bg-[#09090b]">
                                <div className="space-y-2">
                                    {mobileNavigationItems.map((item) => {
                                        const isActiveLink = isActive(item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActiveLink
                                                    ? 'bg-white/10 text-white border border-white/10 font-medium'
                                                    : 'bg-white/5 text-white/70 border border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.name}</span>
                                            </Link>
                                        )
                                    })}

                                    <div className="h-px bg-white/10 my-3" />

                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                        <span className="text-white/60 text-sm">Credits</span>
                                        <div className="flex items-center gap-2">
                                            <CreditIcon className="w-5 h-5 bg-transparent text-[#FFFF00]" iconClassName="w-4 h-4" />
                                            <span className="font-bold text-white">{creditsLoading ? '...' : credits.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsPlansPopupOpen(true);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full bg-[#FFFF00] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-2"
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
                            className="absolute top-6 right-6 p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all z-50"
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
