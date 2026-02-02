'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth-client-simple'

const menuItems = [
  { name: 'Gallery', href: '#comparison-section' },
  { name: 'Pricing', href: '#pricing-section' },
  { name: 'About', href: '/about' },
]

export function NavigationHero4() {
  const [menuState, setMenuState] = React.useState(false)
  const { user } = useAuth()

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const targetId = href.substring(1)
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' })
      }
      setMenuState(false)
    }
  }

  const loginHref = user ? '/app/dashboard' : '/app/login'
  const loginText = user ? 'Dashboard' : 'Login'

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] px-4 py-4 md:px-6">
      <nav className="glass-premium mx-auto max-w-7xl rounded-2xl border border-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="home"
            className="flex items-center space-x-2 group"
          >
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-white/70 transition-all duration-300 hover:text-white hover:text-shadow-glow relative group"
                    onClick={(e) => handleNavigation(item.href, e)}
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                <Link href={loginHref}>
                  {loginText}
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="btn-premium text-sm font-bold text-white shadow-neon hover:shadow-neon-strong transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Link href="/app/signup">
                  Sign Up
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuState(!menuState)}
              aria-label={menuState ? 'Close Menu' : 'Open Menu'}
              className="relative z-50 block p-2 lg:hidden text-white/80 hover:text-white transition-colors"
            >
              <div className="relative w-6 h-6">
                <Menu className={`absolute inset-0 w-full h-full transition-all duration-300 ${menuState ? 'rotate-180 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
                <X className={`absolute inset-0 w-full h-full transition-all duration-300 ${menuState ? 'rotate-0 opacity-100 scale-100' : '-rotate-180 opacity-0 scale-50'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`absolute inset-x-0 top-full mt-4 p-4 glass-card-elevated rounded-2xl transform transition-all duration-300 origin-top lg:hidden ${menuState
            ? 'opacity-100 scale-100 translate-y-0 visible'
            : 'opacity-0 scale-95 -translate-y-4 invisible'
            }`}
        >
          <ul className="flex flex-col space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className="block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  onClick={(e) => handleNavigation(item.href, e)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-3 sm:hidden">
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/5"
              >
                <Link href={loginHref}>
                  {loginText}
                </Link>
              </Button>
              <Button
                asChild
                className="w-full btn-premium justify-center"
              >
                <Link href="/app/signup">
                  Sign Up
                </Link>
              </Button>
            </div>
          </ul>
        </div>
      </nav>
    </header>
  )
}

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white hover:text-accent-neon transition-colors duration-300 cursor-pointer">
        Sharpii.ai
      </span>
    </div>
  )
}