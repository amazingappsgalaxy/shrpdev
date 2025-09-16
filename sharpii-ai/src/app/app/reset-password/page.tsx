"use client"

import Link from 'next/link'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold">Password Reset</h1>
        <p className="text-muted-foreground">
          Password reset via email is temporarily unavailable.
          Please use the Forgot password option on the sign-in page or contact support.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/app/login" className="underline text-primary">
            Go to Sign in
          </Link>
          <a href="mailto:support@sharpii.ai" className="underline text-primary">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}