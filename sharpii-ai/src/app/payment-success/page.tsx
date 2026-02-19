'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2, ExternalLink, Clock } from 'lucide-react'
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

// After MAX_RETRIES × 5 s (= 60 s) we assume the webhook will handle it and
// redirect the user to the dashboard with an informational message.
const MAX_RETRIES = 12

function PaymentSuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'async' | 'completed' | 'error'>('processing')
  const [countdown, setCountdown] = useState(5)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const retryCount = useRef(0)

  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    const sessionId = searchParams.get('session_id') || searchParams.get('session')
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('subscriptionId')

    console.log('Payment success page - URL params:', {
      paymentId,
      sessionId,
      subscriptionId,
      allParams: Object.fromEntries(searchParams.entries())
    })

    // No identifiers means Dodo has not appended them yet – treat as success
    if (!subscriptionId && !paymentId && !sessionId) {
      setStatus('completed')
      return
    }

    const run = async () => {
      if (retryCount.current >= MAX_RETRIES) {
        // Stop retrying – the webhook will handle it asynchronously
        console.log('Max retries reached – redirecting to dashboard (webhook handles credits)')
        setStatus('async')
        setCountdown(5)
        return
      }

      try {
        const body = subscriptionId
          ? { subscriptionId }
          : paymentId
            ? { paymentId }
            : { sessionId }

        const res = await fetch('/api/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })

        if (res.status === 202) {
          retryCount.current += 1
          console.log(`Payment pending, retry ${retryCount.current}/${MAX_RETRIES}`)
          setTimeout(run, 5000)
          return
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({} as any))
          if (res.status === 401 || res.status === 403) {
            router.push('/app/login?redirect=/payment-success')
            return
          }
          setErrorMessage(data?.error || data?.details || 'Failed to complete payment')
          setStatus('error')
          return
        }

        setStatus('completed')
        setCountdown(5)
      } catch {
        retryCount.current += 1
        if (retryCount.current < MAX_RETRIES) {
          setTimeout(run, 5000)
        } else {
          setStatus('async')
          setCountdown(5)
        }
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (status !== 'completed' && status !== 'async') return
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [status, countdown])

  useEffect(() => {
    if ((status === 'completed' || status === 'async') && countdown === 0) {
      router.push('/app/dashboard')
    }
  }, [status, countdown, router])

  const handleManualRedirect = () => router.push('/app/dashboard')

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
          ) : status === 'async' ? (
            <>
              <Clock className="h-16 w-16 text-yellow-500 mx-auto" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Payment Received!
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
          {status === 'processing' && (
            <p className="text-gray-600">
              We&apos;re confirming your payment and setting up your credits...
            </p>
          )}

          {status === 'async' && (
            <>
              <p className="text-gray-600">
                Your payment was received! Credits will appear in your account within a
                minute. No action needed from you.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  Redirecting to your dashboard in {countdown} seconds...
                </p>
                <Button onClick={handleManualRedirect} className="mt-2 w-full" variant="outline">
                  Go to Dashboard Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-gray-600">
                {errorMessage || 'We could not confirm your payment. Please try again.'}
              </p>
              <Button onClick={() => window.location.reload()} className="w-full" variant="outline">
                Retry
              </Button>
              <Button onClick={handleManualRedirect} className="w-full">
                Go to Dashboard
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {status === 'completed' && (
            <>
              <p className="text-gray-600 mb-4">
                Your payment has been processed successfully! Credits have been added to your account.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-2">
                  Redirecting to your dashboard in {countdown} seconds...
                </p>
                <Button onClick={handleManualRedirect} className="mt-2 w-full" variant="outline">
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
