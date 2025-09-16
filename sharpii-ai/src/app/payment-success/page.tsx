'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader className="space-y-4">
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <CardTitle className="text-2xl font-bold text-gray-900">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <PaymentSuccessClient />
    </Suspense>
  )
}

function PaymentSuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('processing')
  const [countdown, setCountdown] = useState(5)
  
  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    const sessionId = searchParams.get('session_id')
    const paymentStatus = searchParams.get('status')
    
    console.log('Payment success page - URL params:', {
      paymentId,
      sessionId, 
      paymentStatus,
      allParams: Object.fromEntries(searchParams.entries())
    })
    
    if (paymentId || sessionId || paymentStatus === 'succeeded') {
      // Simulate processing
      setTimeout(() => {
        setStatus('completed')
        
        // Start countdown timer
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              router.push('/app/dashboard')
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        return () => clearInterval(timer)
      }, 2000)
    } else {
      // No payment info, assume success and redirect
      setTimeout(() => {
        setStatus('completed')
        setTimeout(() => {
          router.push('/app/dashboard')
        }, 3000)
      }, 1000)
    }
  }, [router, searchParams])
  
  const handleManualRedirect = () => {
    router.push('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader className="space-y-4">
          {status === 'processing' ? (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Processing Payment...
              </CardTitle>
            </>
          ) : (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Payment Successful!
              </CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'processing' ? (
            <p className="text-gray-600">
              We're confirming your payment and setting up your credits...
            </p>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Your payment has been processed successfully! Credits have been added to your account.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-2">
                  Redirecting to your dashboard in {countdown} seconds...
                </p>
                <Button 
                  onClick={handleManualRedirect}
                  className="mt-2 w-full"
                  variant="outline"
                >
                  Go to Dashboard Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}