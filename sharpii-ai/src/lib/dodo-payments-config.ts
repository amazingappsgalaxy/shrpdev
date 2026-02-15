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
} as const

// Plan configuration mapping
export const PLAN_CONFIG = {
  basic: {
    name: 'Basic',
    credits: 1000,
    price: { monthly: 9, yearly: 108 }, // $9/month, $108/year (9*12)
    features: ['1,000 monthly credits', 'Around 135 images can be enhanced', 'HD resolution only (1080p)', 'Basic skin enhancement'],
  },
  creator: {
    name: 'Creator',
    credits: 5000,
    price: { monthly: 25, yearly: 252 }, // $25/month, $252/year (21*12)
    features: ['5,000 monthly credits', 'Around 370 images can be enhanced', 'Supports up to 2K resolution', 'Advanced skin enhancement'],
  },
  professional: {
    name: 'Professional',
    credits: 15000,
    price: { monthly: 39, yearly: 408 }, // $39/month, $408/year (34*12)
    features: ['15,000 monthly credits', 'Around 615 images can be enhanced', 'Supports up to 4K resolution', 'Photo-real skin restoration'],
  },
  enterprise: {
    name: 'Enterprise',
    credits: 50000,
    price: { monthly: 99, yearly: 1008 }, // $99/month, $1008/year (84*12)
    features: ['50,000 monthly credits', 'Around 1,565 images can be enhanced', 'Supports up to 4K resolution', 'Photo-real skin restoration'],
  },
} as const

export type PlanType = keyof typeof PLAN_CONFIG
export type BillingPeriod = 'monthly' | 'yearly'