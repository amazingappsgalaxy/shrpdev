'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth, useSession } from '@/lib/auth-client-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'
import { Clock, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

// Safe date formatter with caching
const dateFormatCache = new Map<number, string>()
const safeFormatDistance = (date: Date | number) => {
  try {
    if (!date) return 'Unknown time'

    const timestamp = typeof date === 'number' ? date : date.getTime()
    if (isNaN(timestamp)) return 'Unknown time'

    if (dateFormatCache.has(timestamp)) {
      return dateFormatCache.get(timestamp)!
    }

    const dateObj = new Date(timestamp)
    const formatted = formatDistanceToNow(dateObj, { addSuffix: true })

    if (dateFormatCache.size > 100) {
      const firstKey = dateFormatCache.keys().next().value
      if (firstKey !== undefined) {
        dateFormatCache.delete(firstKey)
      }
    }
    dateFormatCache.set(timestamp, formatted)

    return formatted
  } catch (error) {
    console.warn('Date formatting error:', error)
    return 'Unknown time'
  }
}

interface CreditsSectionProps {
  className?: string
}

interface CreditPackage {
  credits: number
  price: number
  currency: string
  description: string
  productId: string
  bonus?: number
}

interface CreditPackages {
  starter: CreditPackage
  popular: CreditPackage
  premium: CreditPackage
  ultimate: CreditPackage
  pro: CreditPackage
  enterprise: CreditPackage
}

// Add caching for better performance
const creditDataCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export default function CreditsSection({ className }: CreditsSectionProps) {
  const { user } = useAuth()
  const { data } = useSession()
  const [creditBalance, setCreditBalance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [packages, setPackages] = useState<CreditPackages | null>(null)
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null)

  const loadCreditData = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      
      // Check cache first
      const cacheKey = `credits_${user.id}`
      const cached = creditDataCache.get(cacheKey)
      const now = Date.now()
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setCreditBalance(cached.data.balance)
        setPackages(cached.data.packages)
        setIsLoading(false)
        return
      }
      
      // Load only essential data - remove heavy UnifiedCreditsService call
      const [balanceResponse, packagesResponse] = await Promise.all([
        fetch('/api/credits/balance', {
          method: 'GET',
          credentials: 'include',
        }),
        fetch('/api/credits/purchase', {
          method: 'GET',
          credentials: 'include',
        })
      ])
      
      let balance = null
      if (balanceResponse.ok) {
        balance = await balanceResponse.json()
      } else {
        // Fallback to basic balance structure
        balance = {
          totalCredits: 0,
          expiringCredits: 0,
          permanentCredits: 0
        }
      }
      
      setCreditBalance(balance)
      
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json()
        // Extend packages to include 6 options with better structure
        const extendedPackages = {
          starter: packagesData.packages?.starter || {
            credits: 100,
            price: 9.99,
            currency: 'USD',
            description: 'Perfect for getting started',
            productId: 'starter_package'
          },
          popular: packagesData.packages?.popular || {
            credits: 500,
            price: 29.99,
            currency: 'USD',
            description: 'Most popular choice',
            productId: 'popular_package',
            bonus: 100
          },
          premium: packagesData.packages?.premium || {
            credits: 1000,
            price: 49.99,
            currency: 'USD',
            description: 'For power users',
            productId: 'premium_package',
            bonus: 200
          },
          ultimate: packagesData.packages?.ultimate || {
            credits: 2000,
            price: 79.99,
            currency: 'USD',
            description: 'Maximum value',
            productId: 'ultimate_package',
            bonus: 400
          },
          pro: {
            credits: 2500,
            price: 99.99,
            currency: 'USD',
            description: 'For professional creators',
            productId: 'pro_package',
            bonus: 500
          },
          enterprise: {
            credits: 5000,
            price: 149.99,
            currency: 'USD',
            description: 'For teams and agencies',
            productId: 'enterprise_package',
            bonus: 1000
          }
        }
        setPackages(extendedPackages)
        
        // Cache the results
        creditDataCache.set(cacheKey, {
          data: { balance, packages: extendedPackages },
          timestamp: now
        })
      }
    } catch (error) {
      console.error('Error loading credit data:', error)
      // Set fallback data to prevent blank screen
      setCreditBalance({
        totalCredits: 0,
        expiringCredits: 0,
        permanentCredits: 0
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadCreditData()
  }, [user?.id, loadCreditData])

  const buildAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (data?.session?.token) {
      headers['Authorization'] = `Bearer ${data.session.token}`
    }
    return headers
  }

  const handlePurchasePackage = async (packageType: string) => {
    if (!user) {
      toast.error('Please login to purchase credits')
      return
    }
    
    setPurchasingPackage(packageType)
    
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: buildAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ packageType })
      })
      
      if (response.status === 401) {
        toast.error('Your session has expired. Please login again.')
        return
      }
      
      const data = await response.json().catch(() => null)
      
      if (response.ok && data?.checkoutUrl) {
        toast.success('Redirecting to payment...')
        window.location.href = data.checkoutUrl
      } else {
        const message = data?.error || 'Failed to create payment'
        toast.error(message)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setPurchasingPackage(null)
    }
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-white/5 rounded-lg"></div>
          <div className="h-32 bg-white/5 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!creditBalance) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <p className="text-white/60">Unable to load credit information</p>
          <Button 
            onClick={loadCreditData}
            variant="outline" 
            className="mt-4 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Credits Balance Section - Dark Theme & Compact */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1e] rounded-lg p-4">
        <div className="mb-3">
          <h3 className="text-base font-medium text-white">Credits Available</h3>
          <p className="text-xs text-white/60">Your current balance</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-white/60" />
          </div>
        ) : creditBalance ? (
          <div className="space-y-3">
            <div className="text-center py-3">
              <div className="text-2xl font-bold text-white">
                {(creditBalance.remaining || creditBalance.totalCredits || 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/60 mt-0.5">Total Credits</div>
            </div>

            {/* Credit Breakdown - Compact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-3 w-3 text-orange-400" />
                  <span className="text-xs font-medium text-white/80">Expiring</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {(creditBalance.breakdown?.expiring?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 
                    creditBalance.expiringCredits || 0).toLocaleString()}
                </div>
                {creditBalance.breakdown?.expiring?.[0]?.expires_at && (
                  <div className="text-xs text-white/50 mt-0.5">
                    Expires {safeFormatDistance(new Date(creditBalance.breakdown.expiring[0].expires_at))}
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-xs font-medium text-white/80">Permanent</span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {(creditBalance.breakdown?.permanent || creditBalance.permanentCredits || 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Never expires</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="h-6 w-6 text-white/40 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Unable to load credit balance</p>
          </div>
        )}
      </div>

      {/* Purchase Credits Section - 6 Packages & Compact */}
      <div id="purchase-section" className="space-y-3">
        <div className="mb-3">
          <h3 className="text-base font-medium text-white">Purchase Credits</h3>
          <p className="text-sm text-white/60 mt-1">Choose the perfect plan for your needs</p>
        </div>

        {packages ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(packages as CreditPackages).map(([packageType, pkg]) => {
              const totalCredits = pkg.credits + (pkg.bonus || 0)
              const isPurchasing = purchasingPackage === packageType
              const isPopular = packageType === 'popular'
              
              return (
                <Card 
                  key={packageType} 
                  className={`relative bg-[#0a0a0a] border-[#1c1c1e] rounded-lg transition-all duration-200 hover:border-white/20 ${
                    isPopular ? 'border-blue-500/50' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="text-center space-y-3">
                      <div>
                        <h4 className="text-base font-medium text-white capitalize mb-1">
                          {packageType}
                        </h4>
                        <div className="text-xl font-bold text-white">
                          ${pkg.price}
                        </div>
                        <div className="text-xs text-white/60 mt-0.5">
                          {pkg.credits.toLocaleString()} credits
                          {pkg.bonus && (
                            <span className="text-green-400"> + {pkg.bonus.toLocaleString()} bonus</span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-white/50 px-1">
                        {pkg.description}
                      </div>

                      <Button
                        onClick={() => handlePurchasePackage(packageType)}
                        disabled={isPurchasing}
                        className={`w-full rounded-lg font-medium transition-all duration-200 text-sm py-2 ${
                          isPopular 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        }`}
                      >
                        {isPurchasing ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Buy Now'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-[#0a0a0a] border-[#1c1c1e] rounded-lg">
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="space-y-1.5">
                      <div className="h-3.5 bg-white/10 rounded w-16 mx-auto"></div>
                      <div className="h-5 bg-white/10 rounded w-12 mx-auto"></div>
                      <div className="h-3 bg-white/10 rounded w-20 mx-auto"></div>
                    </div>
                    <div className="h-8 bg-white/10 rounded-lg"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}