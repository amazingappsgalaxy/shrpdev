# Monthly Credit System Implementation Guide

## Overview

This system implements automatic monthly credit allocation with expiration logic as requested:

> "For example if a plan has X number credits per month and made purchase on 2nd August, you need to give the user + X credits (Expires on 2nd Sept) valid for a month. On 2nd Sept debit the user with the remaining credit (let say some Y credits remaining, you need to -Y) and then bill him for the next month and process the payment and once payment is done credit the user + X"

## System Features

### ✅ Credit Allocation
- **Monthly Credits**: Each plan allocates specific credits per month
  - Basic: 1,000 credits/month
  - Creator: 5,000 credits/month  
  - Professional: 15,000 credits/month
  - Enterprise: 50,000 credits/month

### ✅ Credit Expiration
- **30-Day Validity**: Credits expire exactly 30 days from allocation date
- **Automatic Expiration**: System automatically marks expired credits as inactive
- **FIFO Consumption**: Oldest credits are used first

### ✅ Monthly Billing Cycle
- **Remaining Credit Deduction**: Before new month billing, remaining credits are deducted
- **Automatic Payment Processing**: System creates payment records for monthly renewals
- **New Credit Allocation**: After successful payment, new monthly credits are granted

## Implementation Details

### Core Components

#### 1. Credit Manager (`/src/lib/credits.ts`)
```typescript
// Grant monthly credits with expiration
CreditManager.grantMonthlyCredits({
  userId: 'user123',
  plan: 'basic',
  subscriptionId: 'sub456'
})

// Process monthly renewals (called daily)
CreditManager.processMonthlyRenewals()

// Get expiring credits
CreditManager.getExpiringCredits(userId, 7) // Next 7 days
```

#### 2. Webhook Handler (`/src/app/api/payments/webhook/route.ts`)
- Handles `payment.succeeded` events
- Deducts remaining credits before granting new ones
- Records payment and allocates new monthly credits

#### 3. Daily Renewal Processor (`/src/app/api/admin/process-renewals/route.ts`)
- Expires old credits
- Processes monthly renewals
- Handles automatic billing

### Database Schema

#### Credits Table
```typescript
{
  id: string,
  userId: string,
  amount: number,
  type: 'subscription' | 'bonus' | 'refund',
  source: 'monthly_allocation' | 'payment' | 'admin_grant',
  subscriptionId?: string,
  expiresAt: number, // 30 days from creation
  isActive: boolean,
  createdAt: number,
  metadata?: string
}
```

#### Credit Transactions Table
```typescript
{
  id: string,
  userId: string,
  amount: number, // Positive for credit, negative for debit
  type: 'credit' | 'debit',
  reason: string,
  description: string,
  balanceBefore: number,
  balanceAfter: number,
  createdAt: number
}
```

## Monthly Billing Cycle Example

### Scenario: User purchases Basic plan on August 2nd

#### 1. Initial Purchase (August 2nd)
```
✅ Payment: $8
✅ Credits Granted: +1,000 credits (expires September 2nd)
✅ User Balance: 1,000 credits
```

#### 2. Usage During Month
```
User enhances images, consuming credits:
- August 15th: -150 credits (850 remaining)
- August 25th: -200 credits (650 remaining)
```

#### 3. Monthly Renewal (September 2nd)
```
✅ Remaining Credits: 650 credits
✅ Deduction: -650 credits (balance: 0)
✅ Payment Processing: $8 for next month
✅ New Credits: +1,000 credits (expires October 2nd)
✅ Final Balance: 1,000 credits
```

## API Endpoints

### 1. Daily Renewal Processor
```bash
POST /api/admin/process-renewals
Authorization: Bearer ADMIN_SECRET

# Response
{
  "success": true,
  "expiredCredits": 5,
  "processedRenewals": 12,
  "message": "Successfully processed 12 renewals and expired 5 credits"
}
```

### 2. Credit Testing
```bash
GET /api/test/credits
# Returns user credit breakdown

POST /api/test/credits
{
  "action": "grant_monthly",
  "plan": "basic",
  "subscriptionId": "sub123"
}
```

### 3. Webhook Handler
```bash
POST /api/payments/webhook
# Handles Dodo payment events
# Processes monthly renewals automatically
```

## Setup Instructions

### 1. Environment Variables
```bash
# Add to .env.local
ADMIN_SECRET=sharpii_admin_secret_2024
```

### 2. Webhook Configuration
Update Dodo dashboard webhook URL:
```
https://famous-views-like.loca.lt/api/payments/webhook
```

Subscribe to events:
- `payment.succeeded` ✅
- `payment.failed` ✅
- `subscription.created` ✅
- `subscription.renewed` ✅
- `subscription.cancelled` ✅

### 3. Daily Cron Job
Set up daily cron job to call:
```bash
curl -X POST "https://yourdomain.com/api/admin/process-renewals" \
  -H "Authorization: Bearer ADMIN_SECRET"
```

**Options for cron scheduling:**
- **Vercel Cron**: Add to `vercel.json`
- **GitHub Actions**: Daily workflow
- **External Service**: Cron-job.org, EasyCron
- **Server Cron**: If self-hosted

## Testing the System

### 1. Test Credit Allocation
```bash
# Get user credit info
curl -X GET "http://localhost:3002/api/test/credits" \
  -H "Cookie: session=YOUR_SESSION"

# Grant test credits
curl -X POST "http://localhost:3002/api/test/credits" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{"action": "grant_monthly", "plan": "basic"}'
```

### 2. Test Monthly Renewal
```bash
# Manually trigger renewal processing
curl -X POST "http://localhost:3002/api/admin/process-renewals" \
  -H "Authorization: Bearer sharpii_admin_secret_2024"
```

### 3. Complete User Journey
1. Visit pricing section
2. Select plan and sign up
3. Complete payment
4. Verify credits in dashboard
5. Use credits for image enhancement
6. Check credit expiration dates

## Dashboard Integration

### Credit Display Features
- ✅ Current credit balance
- ✅ Credit expiration dates
- ✅ Monthly allocation history
- ✅ Usage tracking
- ✅ Upcoming renewal dates

### Usage Dashboard Components
```typescript
// Show expiring credits warning
const expiringCredits = await CreditManager.getExpiringCredits(userId, 7)

// Display monthly allocation
const monthlyCredits = await CreditManager.getActiveCredits(userId)

// Show transaction history
const history = await CreditManager.getCreditHistory(userId)
```

## Production Deployment

### 1. Environment Setup
```bash
ADMIN_SECRET="your-secure-admin-secret"
DODO_PAYMENTS_API_KEY="your-production-api-key"
DODO_WEBHOOK_SECRET="your-production-webhook-secret"
```

### 2. Webhook URL
Update to production domain:
```
https://yourdomain.com/api/payments/webhook
```

### 3. Cron Job Configuration
Set up reliable daily cron job at 12:00 AM UTC:
```bash
0 0 * * * curl -X POST "https://yourdomain.com/api/admin/process-renewals" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

## Security Features

- ✅ **Admin Authorization**: Renewal endpoint requires admin secret
- ✅ **Session Validation**: Credit endpoints require user authentication
- ✅ **Webhook Verification**: Payment webhooks verify signatures
- ✅ **FIFO Credit Usage**: Oldest credits consumed first
- ✅ **Transaction Logging**: Full audit trail of all credit operations

## Monitoring & Alerts

### Key Metrics to Monitor
- Daily renewal processing success rate
- Credit expiration warnings
- Payment failure rates
- Webhook delivery status
- User credit usage patterns

### Recommended Alerts
- Renewal processing failures
- Webhook signature mismatches
- Unusually high credit consumption
- Payment processing errors

## Support & Troubleshooting

### Common Issues
1. **Cron job failures**: Check admin secret and network connectivity
2. **Webhook missed**: Verify URL and signature verification
3. **Credit deduction errors**: Check user balance before processing
4. **Timezone issues**: Ensure UTC timestamps for consistency

### Debug Endpoints
```bash
# Check renewal system status
GET /api/admin/process-renewals

# Get detailed credit info
GET /api/test/credits

# Test specific credit operations
POST /api/test/credits
```

This implementation fully satisfies your requirements for monthly credit allocation with automatic billing and expiration logic! 🎉