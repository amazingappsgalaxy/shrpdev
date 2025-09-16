# Dodo Payments Setup Guide

## 🚀 Complete Dodo Payments Integration

The Dodo payments integration is now fully implemented. Follow these steps to complete the setup:

## 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_dodo_api_key_here
DODO_WEBHOOK_SECRET=your_webhook_secret_here

# Dodo Product IDs (create these in your Dodo dashboard)
DODO_BASIC_MONTHLY_PRODUCT_ID=pdt_basic_monthly_sharpii
DODO_BASIC_YEARLY_PRODUCT_ID=pdt_basic_yearly_sharpii
DODO_CREATOR_MONTHLY_PRODUCT_ID=pdt_creator_monthly_sharpii
DODO_CREATOR_YEARLY_PRODUCT_ID=pdt_creator_yearly_sharpii
DODO_PROFESSIONAL_MONTHLY_PRODUCT_ID=pdt_professional_monthly_sharpii
DODO_PROFESSIONAL_YEARLY_PRODUCT_ID=pdt_professional_yearly_sharpii
DODO_ENTERPRISE_MONTHLY_PRODUCT_ID=pdt_enterprise_monthly_sharpii
DODO_ENTERPRISE_YEARLY_PRODUCT_ID=pdt_enterprise_yearly_sharpii

# Return URLs
DODO_PAYMENTS_RETURN_URL=http://localhost:3002/app/dashboard?payment=success
DODO_PAYMENTS_CANCEL_URL=http://localhost:3002/?payment=cancelled#pricing-section

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

## 2. Dodo Payments Dashboard Setup

### Step 1: Create Products
In your Dodo Payments dashboard, create the following subscription products:

1. **Basic Plan**
   - Monthly: $8/month (Product ID: `pdt_basic_monthly_sharpii`)
   - Yearly: $96/year (Product ID: `pdt_basic_yearly_sharpii`)

2. **Creator Plan**
   - Monthly: $25/month (Product ID: `pdt_creator_monthly_sharpii`)
   - Yearly: $252/year (Product ID: `pdt_creator_yearly_sharpii`)

3. **Professional Plan**
   - Monthly: $39/month (Product ID: `pdt_professional_monthly_sharpii`)
   - Yearly: $408/year (Product ID: `pdt_professional_yearly_sharpii`)

4. **Enterprise Plan**
   - Monthly: $99/month (Product ID: `pdt_enterprise_monthly_sharpii`)
   - Yearly: $1008/year (Product ID: `pdt_enterprise_yearly_sharpii`)

### Step 2: Set Up Webhooks
Configure webhook endpoints in your Dodo dashboard:

**Webhook URL:** `https://your-domain.com/api/payments/webhook`

**Events to subscribe to:**
- `subscription.active`
- `subscription.renewed`
- `subscription.failed`
- `subscription.on_hold`
- `payment.succeeded`
- `payment.failed`

## 3. Implementation Features

### ✅ Completed Features

1. **Authentication Flow**
   - User clicks "Get Started" → redirected to login if not authenticated
   - After login → automatically redirected to Dodo payment page
   - Selected plan is stored in localStorage during auth flow

2. **Payment Processing**
   - Complete Dodo Payments API integration
   - Subscription creation with customer details
   - Payment link generation and redirection

3. **Credit Management**
   - Automatic credit allocation after successful payment
   - Monthly credit grants based on plan
   - Credit expiration (30 days from grant)
   - FIFO credit consumption system

4. **Webhook Processing**
   - `subscription.active` → Grant initial credits
   - `subscription.renewed` → Grant monthly credits
   - `payment.succeeded` → Record payment
   - `payment.failed` → Handle failures

5. **Dashboard Integration**
   - Usage dashboard with credit overview
   - Transaction history
   - Credit balance in user dropdown
   - Real-time credit updates

6. **UI Components**
   - Enhanced pricing section with auth flow
   - Usage dashboard component
   - Credit display in header
   - Payment success/failure handling

## 4. Testing the Integration

### Test 1: API Connection
```bash
curl -X GET "http://localhost:3002/api/test-dodo"
```

### Test 2: Authentication Protection
```bash
curl -X POST "http://localhost:3002/api/payments/checkout" \
  -H "Content-Type: application/json" \
  -d '{"plan": "basic", "billingPeriod": "monthly"}'
```

### Test 3: Full Flow
1. Visit `http://localhost:3002`
2. Scroll to pricing section
3. Click "Get Started" on any plan
4. Sign up or log in
5. Verify redirect to Dodo payment page
6. Complete payment (test mode)
7. Verify credits are added to account
8. Check usage dashboard

## 5. Credit System Details

### Credit Allocation
- **Basic**: 1,000 credits/month
- **Creator**: 5,000 credits/month  
- **Professional**: 15,000 credits/month
- **Enterprise**: 50,000 credits/month

### Credit Features
- ✅ Monthly allocation on subscription renewal
- ✅ Credit expiration (30 days)
- ✅ FIFO consumption (oldest credits used first)
- ✅ Real-time balance tracking
- ✅ Transaction history
- ✅ Usage analytics

## 6. File Structure

```
src/
├── app/api/payments/
│   ├── checkout/route.ts          # Payment session creation
│   └── webhook/route.ts           # Webhook handler
├── components/app/
│   ├── UsageDashboard.tsx         # Credit usage dashboard
│   └── UserHeader.tsx             # Header with credit display
├── lib/
│   ├── credits.ts                 # Credit management system
│   └── dodo-payments-config.ts    # Payment configuration
└── components/ui/
    └── pricing-section-new.tsx    # Enhanced pricing component
```

## 7. Security Notes

- API keys are stored in environment variables
- Webhook signatures are verified
- User authentication required for all payment operations
- Credit transactions are logged for audit trail

## 8. Production Deployment

1. Update environment variables for production
2. Change Dodo environment to `live_mode`
3. Update return URLs to production domain
4. Configure production webhook endpoints
5. Test with real payment methods

## 🎉 Your Payment System is Ready!

The complete Dodo payments integration is now implemented with:
- ✅ Full authentication flow
- ✅ Payment processing
- ✅ Credit management
- ✅ Webhook handling
- ✅ Dashboard integration
- ✅ Real-time updates
- ✅ Credit deduction for image enhancement
- ✅ Insufficient credits protection

Just add your Dodo API credentials and product IDs to start accepting payments!

## 🧪 Complete Testing Guide

### Step 1: Test Server Status
```bash
cd /Users/dheer/Documents/sharpcode/sharpii-ai
npm run dev
```

### Step 2: Test Authentication Flow
1. Open http://localhost:3002
2. Click "Get Started" on any pricing plan
3. You should be redirected to login page
4. Sign up with a test account
5. After login, you should automatically be redirected to Dodo checkout
6. (Will fail without real API credentials - expected)

### Step 3: Test API Endpoints
```bash
# Test checkout API (should return 401 without auth)
curl -X POST http://localhost:3002/api/payments/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "basic", "billingPeriod": "monthly"}'

# Test webhook API (should return 400 missing signature)
curl -X POST http://localhost:3002/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type": "test"}'
```

### Step 4: Test Credit System
1. Complete user registration and login
2. Manually grant credits via database (for testing)
3. Try image enhancement - should deduct credits
4. Check credit balance in header dropdown
5. View usage dashboard for transaction history

### Step 5: Production Setup
1. Get real Dodo API credentials from dashboard
2. Update environment variables
3. Create actual products in Dodo dashboard
4. Test with real payment methods
5. Configure webhooks in production

## 🔧 Manual Credit Grant (For Testing)

To test the credit system without payments, you can manually grant credits:

```typescript
// In browser console on dashboard page:
fetch('/api/admin/grant-credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your-user-id',
    amount: 1000,
    reason: 'testing'
  })
})
```

## 🎯 Credit Deduction System

The credit system now automatically:
1. **Pre-calculates** required credits before enhancement
2. **Checks balance** and blocks insufficient credit requests
3. **Deducts credits** only after successful enhancement
4. **Uses FIFO** consumption (oldest credits first)
5. **Tracks transactions** for full audit trail
6. **Handles errors** gracefully without breaking enhancement

### Credit Calculation Rules
- **Standard**: 100-130 credits per image (≤1MP)
- **HD**: 130-180 credits per image (≤2MP)
- **4K**: 180+ credits per image (>2MP)
- Based on actual image dimensions
- Higher resolution = more credits

### Error Handling
- Returns **402 Payment Required** for insufficient credits
- Updates task status to **failed** with clear error message
- Provides current balance and required amount
- No credits deducted on failed enhancements