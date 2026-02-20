'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, AlertCircle, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#FFFF00] animate-spin" />
        </div>
      }
    >
      <PaymentSuccessClient />
    </Suspense>
  )
}

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

    if (!subscriptionId && !paymentId && !sessionId) {
      setStatus('completed')
      return
    }

    const run = async () => {
      if (retryCount.current >= MAX_RETRIES) {
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
          setTimeout(run, 5000)
          return
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({} as any))
          if (res.status === 401 || res.status === 403) {
            router.push('/app/signin?redirect=/payment-success')
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FFFF00]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-2xl font-bold tracking-tight text-white">Sharpii<span className="text-[#FFFF00]">.ai</span></span>
        </div>

        <AnimatePresence mode="wait">
          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
            >
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-[#FFFF00]/20 animate-ping" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#FFFF00]/10 border border-[#FFFF00]/30">
                  <Loader2 className="w-8 h-8 text-[#FFFF00] animate-spin" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Confirming Payment</h1>
              <p className="text-white/50 text-sm">Verifying your payment with Dodo Payments...</p>

              {/* Retry indicator */}
              <div className="mt-6 flex items-center justify-center gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
              {retryCount.current > 0 && (
                <p className="text-white/30 text-xs mt-3">Checking... ({retryCount.current}/{MAX_RETRIES})</p>
              )}
            </motion.div>
          )}

          {status === 'async' && (
            <motion.div
              key="async"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
            >
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto mb-6">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Payment Received</h1>
              <p className="text-white/50 text-sm mb-6">
                Your payment is being processed. Credits will appear in your account within a minute — no action needed.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                <p className="text-amber-400/80 text-sm">
                  Redirecting to dashboard in <span className="font-bold text-amber-400">{countdown}s</span>
                </p>
              </div>

              <button
                onClick={handleManualRedirect}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl py-3 text-sm font-medium transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
            >
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-white/50 text-sm mb-6">
                {errorMessage || 'We could not confirm your payment. If your card was charged, please contact support.'}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-xl py-3 text-sm transition-all"
                >
                  Retry
                </button>
                <button
                  onClick={handleManualRedirect}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl py-3 text-sm font-medium transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {status === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
            >
              {/* Success icon with glow */}
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full bg-[#FFFF00]/20 blur-xl" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#FFFF00]/15 border border-[#FFFF00]/40">
                  <CheckCircle className="w-8 h-8 text-[#FFFF00]" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#FFFF00]" />
                <h1 className="text-xl font-bold text-white">Payment Successful!</h1>
                <Sparkles className="w-4 h-4 text-[#FFFF00]" />
              </div>
              <p className="text-white/50 text-sm mb-6">
                Your credits have been added to your account. Welcome aboard!
              </p>

              <div className="bg-[#FFFF00]/10 border border-[#FFFF00]/20 rounded-xl p-4 mb-4">
                <p className="text-[#FFFF00]/80 text-sm">
                  Redirecting to dashboard in <span className="font-bold text-[#FFFF00]">{countdown}s</span>
                </p>
              </div>

              <button
                onClick={handleManualRedirect}
                className="w-full flex items-center justify-center gap-2 bg-[#FFFF00] hover:bg-[#c9c900] text-black font-bold rounded-xl py-3 text-sm transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
