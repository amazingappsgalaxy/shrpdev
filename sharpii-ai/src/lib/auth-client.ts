'use client'

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3002",
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient

// Export types for better TypeScript support
export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session.user