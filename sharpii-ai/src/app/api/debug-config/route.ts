import { NextRequest, NextResponse } from 'next/server'
import { DODO_PAYMENTS_CONFIG, DODO_PRODUCT_IDS } from '@/lib/dodo-payments-config'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    config: {
      apiKey: DODO_PAYMENTS_CONFIG.apiKey?.substring(0, 20) + '...',
      environment: DODO_PAYMENTS_CONFIG.environment,
      returnUrl: DODO_PAYMENTS_CONFIG.returnUrl,
      cancelUrl: DODO_PAYMENTS_CONFIG.cancelUrl
    },
    productIds: DODO_PRODUCT_IDS,
    envVars: {
      DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY?.substring(0, 20) + '...',
      NODE_ENV: process.env.NODE_ENV,
      DODO_CREATOR_MONTHLY_PRODUCT_ID: process.env.DODO_CREATOR_MONTHLY_PRODUCT_ID,
      DODO_CREATOR_YEARLY_PRODUCT_ID: process.env.DODO_CREATOR_YEARLY_PRODUCT_ID
    }
  })
}