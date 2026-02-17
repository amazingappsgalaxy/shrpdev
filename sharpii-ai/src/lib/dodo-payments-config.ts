// Dodo Payments configuration
export const DODO_PAYMENTS_CONFIG = {
  apiKey: process.env.DODO_PAYMENTS_API_KEY || '',
  environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
  webhookSecret: process.env.DODO_WEBHOOK_SECRET || process.env.DODO_PAYMENTS_WEBHOOK_SECRET || '',
  // Use NEXT_PUBLIC_APP_URL for client-visible base URL; fall back to localhost:3002
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/app/dashboard?payment=success`,
  cancelUrl: process.env.DODO_PAYMENTS_CANCEL_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/?payment=cancelled#pricing-section`,
} as const

// Product IDs for each pricing plan (must be set via env; no hardcoded fallbacks)
export const DODO_PRODUCT_IDS = {
  basic: {
    monthly: process.env.DODO_BASIC_MONTHLY_PRODUCT_ID,
    yearly: process.env.DODO_BASIC_YEARLY_PRODUCT_ID,
  },
  creator: {
    monthly: process.env.DODO_CREATOR_MONTHLY_PRODUCT_ID,
    yearly: process.env.DODO_CREATOR_YEARLY_PRODUCT_ID,
  },
  professional: {
    monthly: process.env.DODO_PROFESSIONAL_MONTHLY_PRODUCT_ID,
    yearly: process.env.DODO_PROFESSIONAL_YEARLY_PRODUCT_ID,
  },
  enterprise: {
    monthly: process.env.DODO_ENTERPRISE_MONTHLY_PRODUCT_ID,
    yearly: process.env.DODO_ENTERPRISE_YEARLY_PRODUCT_ID,
  },
  'day pass': {
    daily: 'pdt_0NYhE3lLB1AVBQ1IF1NzS',
  }
} as const

// Plan configuration mapping (Legacy support, PRICING_PLANS is main source)
export const PLAN_CONFIG = {
  // ... existing plans (kept for existing code compatibility)
} as const

export type PlanType = 'basic' | 'creator' | 'professional' | 'enterprise' | 'day pass'
export type BillingPeriod = 'monthly' | 'yearly' | 'daily'