'use client'

import useSWR from 'swr'

export const APP_DATA_KEY = '/api/user/me'

interface AppUser {
  id: string
  email: string
  name: string
}

interface AppCredits {
  total: number
  subscription_credits: number
  permanent_credits: number
  subscription_expire_at: string | null
}

interface AppSubscription {
  has_active_subscription: boolean
  current_plan: string
  subscription: any
}

interface AppProfile {
  id: string
  name: string
  email: string
  createdAt: string
  hasPassword: boolean
}

interface AppData {
  user: AppUser | null
  credits: AppCredits | null
  subscription: AppSubscription | null
  profile: AppProfile | null
}

export function useAppData() {
  const { data, error, isLoading, mutate } = useSWR<AppData>(APP_DATA_KEY)

  return {
    user: data?.user ?? null,
    credits: data?.credits ?? null,
    subscription: data?.subscription ?? null,
    profile: data?.profile ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
    mutate,
  }
}
