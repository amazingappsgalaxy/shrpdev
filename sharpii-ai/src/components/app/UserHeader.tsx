'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, signOut as simpleSignOut } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { MainLogo } from '@/components/ui/main-logo'
import {
    Menu,
    X,
    Crown,
    ChevronDown,
    LogOut,
    LayoutDashboard,
    Palette,
    BarChart3,
    Wand2,
    Image as ImageIcon,
    Sparkles,
    ArrowRight,
    Zap,
    CreditCard,
} from 'lucide-react'
import { MyPricingPlans2 } from '@/components/ui/mypricingplans2'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditIcon } from '@/components/ui/CreditIcon'

// Plan display label & next-plan upsell logic
const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic',
    creator: 'Creator',
    professional: 'Pro',
    enterprise: 'Enterprise',
    'day pass': 'Day Pass',
    free: 'Free',
}

const UPSELL_MAP: Record<string, { label: string; plan: string; billingPeriod: string; tagline: string } | null> = {
    free: { label: 'Creator', plan: 'creator', billingPeriod: 'monthly', tagline: '44,400 credits/mo' },
    basic: { label: 'Creator', plan: 'creator', billingPeriod: 'monthly', tagline: '3× more credits + 2K resolution' },
    creator: { label: 'Pro', plan: 'professional', billingPeriod: 'monthly', tagline: '73,800 credits + 4K resolution' },
    professional: { label: 'Enterprise', plan: 'enterprise', billingPeriod: 'monthly', tagline: '187,800 credits/mo' },
    enterprise: null,
    'day pass': { label: 'Creator', plan: 'creator', billingPeriod: 'monthly', tagline: 'Unlimited days + more credits' },
}

interface UserHeaderProps {
    className?: string
}

export function UserHeader({ className }: UserHeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isPlansPopupOpen, setIsPlansPopupOpen] = useState(false)
    const { user: currentUser } = useAuth()

    // Credits
    const [credits, setCredits] = useState(0)
    const [creditsLoading, setCreditsLoading] = useState(true)

    // Subscription info
    const [currentPlan, setCurrentPlan] = useState<string>('free')
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free')
    const [subLoading, setSubLoading] = useState(true)

    // Hover card state (JS-based to avoid CSS group-hover gap)
    const [hoverCardOpen, setHoverCardOpen] = useState(false)
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!currentUser?.id) return

        const fetchCredits = async () => {
            try {
                setCreditsLoading(true)
                const balance = await UnifiedCreditsService.getUserCredits(currentUser.id)
                setCredits(balance.total || 0)
            } catch {
                setCredits(0)
            } finally {
                setCreditsLoading(false)
            }
        }

        const fetchSubscription = async () => {
            try {
                const res = await fetch('/api/user/subscription', { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setCurrentPlan(data.current_plan || 'free')
                    setSubscriptionStatus(data.subscription?.status || 'free')
                }
            } catch {
            } finally {
                setSubLoading(false)
            }
        }

        fetchCredits()
        fetchSubscription()

        const interval = setInterval(fetchCredits, 30000)
        return () => clearInterval(interval)
    }, [currentUser?.id])

    // Listen for cross-component "open plans popup" events
    useEffect(() => {
        const handleOpenPlans = () => setIsPlansPopupOpen(true)
        window.addEventListener('sharpii:open-plans', handleOpenPlans)
        return () => window.removeEventListener('sharpii:open-plans', handleOpenPlans)
    }, [])

    const handleHoverEnter = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        setHoverCardOpen(true)
    }
    const handleHoverLeave = () => {
        hoverTimer.current = setTimeout(() => setHoverCardOpen(false), 150)
    }

    const user = currentUser
    const username = user?.name || user?.email?.split('@')[0] || 'User'

    const handleSignOut = async () => {
        try {
            await simpleSignOut()
            router.push('/')
        } catch { }
    }

    const isActive = (href: string) => pathname.startsWith(href)

    const userMenuItems = [
        { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
        { name: 'Billing', href: '/app/dashboard?tab=billing', icon: CreditCard },
    ]

    const navigationItems = [
        { name: 'Dashboard', href: '/app/dashboard' },
        { name: 'Editor', href: '/app/editor' },
        { name: 'History', href: '/app/history' },
        { name: 'Image Editor', href: '/app/image-editor' },
        { name: 'Generate', href: '/app/generate-image' },
    ]

    const mobileNavigationItems = [
        { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
        { name: 'Editor', href: '/app/editor', icon: Palette },
        { name: 'History', href: '/app/history', icon: BarChart3 },
        { name: 'Image Editor', href: '/app/image-editor', icon: Wand2 },
        { name: 'Generate', href: '/app/generate-image', icon: ImageIcon },
    ]

    const hasActivePlan = currentPlan !== 'free'
    const upsell = UPSELL_MAP[currentPlan] || null
    const planLabel = PLAN_LABELS[currentPlan] || currentPlan

    // Plan badge color — solid colors (no opacity tricks)
    const planBadgeClass = hasActivePlan
        ? currentPlan === 'enterprise'
            ? 'bg-purple-600 border-purple-600 text-white'
            : currentPlan === 'professional'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-[#FFFF00] border-[#FFFF00] text-black'
        : 'bg-white/10 border-white/20 text-white/60'

    const handleCheckout = async (plan: string, billingPeriod: string) => {
        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan, billingPeriod }),
            })
            const data = await res.json()
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            }
        } catch { }
    }

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-[9999] overflow-visible ${className || ''}`}>
                <nav className="w-full bg-[#09090b]/90 border-b border-white/5 px-4 h-16 shadow-sm backdrop-blur-xl md:px-6 relative transition-all duration-300 flex items-center justify-between overflow-visible z-50">

                    {/* Logo */}
                    <div className="flex items-center flex-shrink-0 min-w-[140px]">
                        <Link href="/" className="flex items-center gap-1 group">
                            <MainLogo />
                        </Link>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden xl:flex items-center flex-1 justify-center">
                        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md relative h-9">
                            {navigationItems.map((item) => {
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`relative px-4 h-full flex items-center justify-center rounded text-sm font-medium transition-all duration-200 ${active
                                            ? 'bg-white/10 text-white shadow-sm'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center justify-end gap-3 flex-shrink-0 min-w-[140px]">

                        {/* Credits */}
                        <div className="hidden md:flex items-center gap-2 select-none">
                            <CreditIcon className="w-5 h-5 text-[#FFFF00]" iconClassName="w-4 h-4" />
                            <span className="text-sm font-bold text-white tabular-nums">
                                {creditsLoading ? '...' : credits.toLocaleString()}
                            </span>
                        </div>

                        {/* Plan-aware button with custom hover card */}
                        <div className="hidden sm:block">
                            {!subLoading && hasActivePlan ? (
                                <div
                                    className="relative"
                                    onMouseEnter={handleHoverEnter}
                                    onMouseLeave={handleHoverLeave}
                                >
                                    <button
                                        onClick={() => setIsPlansPopupOpen(true)}
                                        className={`flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${planBadgeClass}`}
                                    >
                                        <Crown className="w-3 h-3 fill-current" />
                                        {planLabel}
                                    </button>

                                    {/* Hover card — JS-controlled to avoid CSS gap bug */}
                                    <div
                                        className={`absolute right-0 top-full mt-1 w-64 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl p-4 z-[10001] transition-all duration-200 origin-top-right ${hoverCardOpen ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'}`}
                                        onMouseEnter={handleHoverEnter}
                                        onMouseLeave={handleHoverLeave}
                                    >
                                        {/* Credits summary */}
                                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                                            <div>
                                                <p className="text-xs text-white/40 mb-0.5">Available Credits</p>
                                                <p className="text-lg font-bold text-white tabular-nums">
                                                    {creditsLoading ? '...' : credits.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className={`px-2 py-1 rounded-md border text-xs font-semibold ${planBadgeClass}`}>
                                                {planLabel}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-2 mb-3 text-xs">
                                            <div className={`w-1.5 h-1.5 rounded-full ${subscriptionStatus === 'active' ? 'bg-green-400' : subscriptionStatus === 'pending_cancellation' ? 'bg-amber-400' : 'bg-white/30'}`} />
                                            <span className="text-white/50">
                                                {subscriptionStatus === 'pending_cancellation' ? 'Cancels at period end' : 'Active subscription'}
                                            </span>
                                        </div>

                                        {/* Upsell CTA */}
                                        {upsell && (
                                            <div className="bg-[#FFFF00]/5 border border-[#FFFF00]/15 rounded-lg p-3 mb-2">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Zap className="w-3 h-3 text-[#FFFF00]" />
                                                    <span className="text-xs font-bold text-[#FFFF00]">Upgrade to {upsell.label}</span>
                                                </div>
                                                <p className="text-xs text-white/40 mb-2">{upsell.tagline}</p>
                                                <button
                                                    onClick={() => handleCheckout(upsell.plan, upsell.billingPeriod)}
                                                    className="w-full flex items-center justify-center gap-1.5 bg-[#FFFF00] hover:bg-[#c9c900] text-black text-xs font-bold rounded-lg py-2 transition-all"
                                                >
                                                    Upgrade Now
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}

                                        <Link
                                            href="/app/dashboard?tab=billing"
                                            className="flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                                        >
                                            Manage subscription
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsPlansPopupOpen(true)}
                                    className="flex items-center gap-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-all duration-300 transform active:scale-95 whitespace-nowrap"
                                >
                                    <Crown className="w-3.5 h-3.5 fill-black" />
                                    <span>Upgrade</span>
                                </button>
                            )}
                        </div>

                        {/* User dropdown */}
                        <DropdownMenu.Root modal={false}>
                            <DropdownMenu.Trigger className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-md transition-all duration-200 hover:bg-white/5 outline-none focus:ring-0 data-[state=open]:bg-white/5">
                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-inner overflow-hidden">
                                    <span className="text-xs font-bold text-white">{username.charAt(0).toUpperCase()}</span>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-white/50 transition-transform duration-200 ease-in-out data-[state=open]:rotate-180" />
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="min-w-[220px] bg-[#0A0A0B] rounded-lg border border-white/10 shadow-xl p-1.5 z-[10000] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                                    sideOffset={8}
                                    align="end"
                                    side="bottom"
                                >
                                    <div className="px-2 py-2 mb-1 bg-white/5 rounded-md border border-white/5">
                                        <p className="text-sm font-bold text-white">{username}</p>
                                        <p className="text-xs text-white/50 truncate font-medium mt-0.5">{user?.email}</p>
                                        {hasActivePlan && (
                                            <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${planBadgeClass}`}>
                                                <Crown className="w-2.5 h-2.5 fill-current" />
                                                {planLabel}
                                            </span>
                                        )}
                                    </div>

                                    {userMenuItems.map((item) => (
                                        <DropdownMenu.Item key={item.href} asChild>
                                            <Link
                                                href={item.href}
                                                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 outline-none cursor-pointer transition-colors"
                                            >
                                                <item.icon className="w-4 h-4 opacity-70" />
                                                {item.name}
                                            </Link>
                                        </DropdownMenu.Item>
                                    ))}

                                    <DropdownMenu.Item asChild>
                                        <Link
                                            href="/app/dashboard?tab=settings"
                                            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 outline-none cursor-pointer transition-colors"
                                        >
                                            <Sparkles className="w-4 h-4 opacity-70" />
                                            Settings
                                        </Link>
                                    </DropdownMenu.Item>

                                    <DropdownMenu.Separator className="h-px bg-white/5 my-1 mx-1" />

                                    <DropdownMenu.Item asChild>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 outline-none cursor-pointer transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 opacity-70" />
                                            Sign Out
                                        </button>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>

                        {/* Mobile toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg bg-white/5 text-white/70 hover:text-white border border-white/10"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </nav>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-4 right-4 top-full mt-2 z-50 lg:hidden"
                        >
                            <div className="rounded-xl border border-white/10 p-4 shadow-2xl bg-[#09090b]">
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
                                                {item.name}
                                            </Link>
                                        )
                                    })}

                                    <div className="h-px bg-white/10 my-3" />

                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div>
                                            <span className="text-white/60 text-sm">Credits</span>
                                            {hasActivePlan && (
                                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border ${planBadgeClass}`}>{planLabel}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditIcon className="w-5 h-5 text-[#FFFF00]" iconClassName="w-4 h-4" />
                                            <span className="font-bold text-white">{creditsLoading ? '...' : credits.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setIsPlansPopupOpen(true); setIsMobileMenuOpen(false) }}
                                        className="w-full bg-[#FFFF00] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Crown className="w-4 h-4 fill-black" />
                                        {hasActivePlan ? 'Manage / Upgrade Plan' : 'Upgrade Plan'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Plans Popup — full-screen overlay with close button */}
            <AnimatePresence>
                {isPlansPopupOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[10000] bg-black/98 backdrop-blur-2xl flex flex-col"
                        onClick={(e) => { if (e.target === e.currentTarget) setIsPlansPopupOpen(false) }}
                    >
                        {/* Header bar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                            <div>
                                <h2 className="text-base font-bold text-white">
                                    {hasActivePlan ? 'Manage Your Plan' : 'Choose a Plan'}
                                </h2>
                                <p className="text-xs text-white/40 mt-0.5">
                                    {hasActivePlan
                                        ? `You're on ${planLabel} — upgrade for more credits and features`
                                        : 'Start with any plan and cancel anytime'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPlansPopupOpen(false)}
                                aria-label="Close"
                                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-7xl mx-auto px-4 py-8">
                                <MyPricingPlans2
                                    showHeader={false}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default UserHeader
