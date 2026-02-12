'use client'

import { useState, useEffect, createContext, useContext } from 'react'

export interface User {
  id: string
  email: string
  name: string
}

export interface Session {
  id: string
  token: string
}

export interface AuthData {
  user: User | null
  session: Session | null
}

// Auth functions
export async function signUp(email: string, password: string, name: string) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Signup failed')
  }
  
  return data
}

export async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Signin failed')
  }
  
  return data
}

export async function signOut() {
  const response = await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'include' // Include cookies for authentication
  })
  
  if (!response.ok) {
    throw new Error('Signout failed')
  }
  
  return response.json()
}

// Fallback function to check if user has session cookie (for browser extension issues)
function hasSessionCookie(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const cookies = document.cookie.split(';')
    return cookies.some(cookie => cookie.trim().startsWith('session='))
  } catch {
    return false
  }
}

export async function getSession(): Promise<AuthData> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return { user: null, session: null }
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // Increased to 30 second timeout
    
    const response = await fetch('/api/auth/session', {
      credentials: 'include', // Include cookies for authentication
      signal: controller.signal,
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.warn('Session check returned non-OK status:', response.status)
      return { user: null, session: null }
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    // Check if it's an abort error (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Session check timed out - may be due to browser extension interference or slow network')
    } else {
      console.warn('Session check failed:', error)
    }
    
    // Fallback: If we have a session cookie but fetch failed, try to use it
    if (hasSessionCookie()) {
      console.warn('Fetch failed but session cookie exists - returning null to retry')
      // Don't return fallback user, let the retry mechanism handle it
      return { user: null, session: null }
    }
    
    return { user: null, session: null }
  }
}

// Hook for using session
export function useSession() {
  const [data, setData] = useState<AuthData>({ user: null, session: null })
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    let retryCount = 0
    const maxRetries = 2 // Reduced retries to prevent endless loops
    
    const loadSession = async () => {
      try {
        const sessionData = await getSession()
        setData(sessionData)
        setIsLoading(false)
      } catch (error) {
        console.warn('Session load error (attempt ' + (retryCount + 1) + '):', error)
        
        if (retryCount < maxRetries) {
          retryCount++
          // Retry with exponential backoff, but with shorter delays
          const delay = Math.min(Math.pow(2, retryCount) * 500, 3000) // Max 3 seconds
          setTimeout(loadSession, delay)
        } else {
          console.error('Failed to load session after', maxRetries + 1, 'attempts')
          setData({ user: null, session: null })
          setIsLoading(false)
        }
      }
    }
    
    loadSession()
  }, [mounted])
  
  const refresh = async () => {
    setIsLoading(true)
    try {
      const sessionData = await getSession()
      setData(sessionData)
    } catch (error) {
      console.error('Session refresh error:', error)
      setData({ user: null, session: null })
    } finally {
      setIsLoading(false)
    }
  }
  
  return {
    data,
    isLoading,
    refresh
  }
}

// Hook for using auth (returns user directly)
export function useAuth() {
  const { data, isLoading } = useSession()
  
  return {
    user: data.user,
    isLoading,
    isAuthenticated: !!data.user
  }
}