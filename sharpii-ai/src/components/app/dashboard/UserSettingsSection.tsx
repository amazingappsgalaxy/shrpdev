'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-client-simple'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Check, Lock, Mail, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface Profile {
  id: string
  name: string
  email: string
  createdAt: string
  hasPassword: boolean
}

export default function UserSettingsSection() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setName(data.name || '')
        }
      } catch {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingProfile(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Profile updated')
        setProfile(prev => prev ? { ...prev, name: name.trim() } : prev)
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      const body: Record<string, string> = { newPassword }
      if (profile?.hasPassword && currentPassword) {
        body.currentPassword = currentPassword
      }
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(profile?.hasPassword ? 'Password updated' : 'Password set successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setProfile(prev => prev ? { ...prev, hasPassword: true } : prev)
      } else {
        toast.error(data.error || 'Failed to update password')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-[#FFFF00] animate-spin" />
      </div>
    )
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : ''

  const avatar = (profile?.name || profile?.email || 'U').charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl space-y-6"
    >
      {/* Account identity */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-[#FFFF00] flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-black text-black">{avatar}</span>
        </div>
        <div>
          <p className="text-base font-bold text-white">{profile?.name || 'Your Account'}</p>
          <p className="text-sm text-white/40">{profile?.email}</p>
          {memberSince && <p className="text-xs text-white/25 mt-0.5">Member since {memberSince}</p>}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/8" />

      {/* Profile form */}
      <form onSubmit={handleSaveProfile}>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Profile</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full bg-white/5 border border-white/8 rounded-md pl-9 pr-4 py-2.5 text-sm text-white/30 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-white/25 mt-1">Email cannot be changed</p>
          </div>

          <button
            type="submit"
            disabled={savingProfile || name === profile?.name}
            className="flex items-center gap-2 bg-[#FFFF00] hover:bg-[#c9c900] disabled:bg-white/8 disabled:text-white/25 disabled:cursor-not-allowed text-black font-bold rounded-md px-4 py-2 text-sm transition-all"
          >
            {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {savingProfile ? 'Saving...' : 'Save Name'}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="h-px bg-white/8" />

      {/* Password form */}
      <form onSubmit={handleSavePassword}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            {profile?.hasPassword ? 'Change Password' : 'Set Password'}
          </p>
          {!profile?.hasPassword && (
            <span className="text-xs text-white/30">Enable email + password sign-in</span>
          )}
        </div>
        <div className="space-y-3">
          {profile?.hasPassword && (
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-white/60 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-white/5 border border-white/10 rounded-md pl-9 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      newPassword.length >= level * 3
                        ? level <= 2 ? 'bg-red-500' : level === 3 ? 'bg-amber-400' : 'bg-green-400'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className={`w-full bg-white/5 border rounded-md pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-500/50 focus:border-red-500/50'
                    : 'border-white/10 focus:border-white/25'
                }`}
                required
              />
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={savingPassword || !newPassword || newPassword !== confirmPassword}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed border border-white/10 text-white font-bold rounded-md px-4 py-2 text-sm transition-all"
          >
            {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {savingPassword ? 'Saving...' : profile?.hasPassword ? 'Change Password' : 'Set Password'}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="h-px bg-white/8" />

      {/* Account meta */}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>Account ID</span>
        <span className="font-mono">{profile?.id?.slice(0, 16)}...</span>
      </div>
    </motion.div>
  )
}
