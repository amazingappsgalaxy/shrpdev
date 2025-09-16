'use client'

export default function BillingSection() {
  return (
    <div>
      {/* Payment History - matching usage section style */}
      <div>
        <h3 className="text-white/90 text-lg font-light mb-6">Payment History</h3>
        <div className="text-center py-8">
          <div className="text-white/40 text-sm">No payment history found</div>
          <div className="text-white/30 text-xs mt-2">Your payment transactions will appear here</div>
        </div>
      </div>
    </div>
  )
}