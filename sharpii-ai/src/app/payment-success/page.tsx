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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    const sessionId = searchParams.get('session_id') || searchParams.get('session')
    const paymentStatus = searchParams.get('status')
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('subscriptionId')
    
    console.log('Payment success page - URL params:', {
      paymentId,
      sessionId, 
      subscriptionId,
      paymentStatus,
      allParams: Object.fromEntries(searchParams.entries())
    })
    
    const run = async () => {
      if (subscriptionId || paymentId || sessionId) {
        try {
          const res = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(
              subscriptionId ? { subscriptionId } : paymentId ? { paymentId } : { sessionId }
            ),
          })
          if (res.status === 202) {
            setTimeout(run, 5000)
            return
          }
          if (!res.ok) {
            const data = await res.json().catch(() => ({} as any))
            setErrorMessage(data?.error || data?.details || 'Failed to complete payment')
            setStatus('error')
            return
          }
        } catch {
          setErrorMessage('Failed to complete payment')
          setStatus('error')
          return
        }
      }

      setStatus('completed')
      setCountdown(5)
    }

    run()
  }, [router, searchParams])

  useEffect(() => {
    if (status !== 'completed') return
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [status, countdown])

  useEffect(() => {
    if (status !== 'completed') return
    if (countdown !== 0) return
    router.push('/app/dashboard')
  }, [status, countdown, router])
  
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
          ) : status === 'error' ? (
            <>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Payment Processing Failed
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
          ) : status === 'error' ? (
            <>
              <p className="text-gray-600">
                {errorMessage || 'We could not confirm your payment. Please try again.'}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
                variant="outline"
              >
                Retry
              </Button>
              <Button
                onClick={handleManualRedirect}
                className="w-full"
              >
                Go to Dashboard
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </>
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
