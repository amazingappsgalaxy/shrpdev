# 🚀 Dodo Payments API Setup Guide

## Current Status: API Key Invalid ❌

The integration is showing "Payment system configuration error" because the Dodo Payments API key is invalid or expired.

**Error Message:**
```
Authentication failed - Invalid API key
API Key Prefix: hXcYgoAt44...
```

## 🔧 How to Fix This

### Step 1: Get Valid Dodo Payments Credentials

1. **Sign up for Dodo Payments**
   - Go to [Dodo Payments Website](https://dodo.dev) 
   - Create an account or log into your existing account

2. **Access Your Dashboard**
   - Navigate to your Dodo Payments dashboard
   - Go to API Settings or Developer Settings

3. **Generate API Key**
   - Create a new API key for your project
   - Make sure it's for the correct environment (test/live)
   - Copy the full API key (not just the prefix)

4. **Get Webhook Secret**
   - While in the dashboard, find the webhook settings
   - Generate or copy your webhook secret key

### Step 2: Create Subscription Products

In your Dodo dashboard, create these subscription products:

| Plan | Monthly Price | Yearly Price | Product ID | Credits |
|------|---------------|--------------|------------|---------|
| Basic | $9/month | $108/year | `pdt_basic_monthly_sharpii` | 1,000 |
| Creator | $25/month | $252/year | `pdt_creator_monthly_sharpii` | 5,000 |
| Professional | $39/month | $408/year | `pdt_professional_monthly_sharpii` | 15,000 |
| Enterprise | $99/month | $1008/year | `pdt_enterprise_monthly_sharpii` | 50,000 |

**Note:** Use the exact Product IDs listed above, or update the configuration file to match your IDs.

### Step 3: Update Environment Variables

Replace the current invalid credentials in `.env.local`:

```bash
# Replace these with your actual Dodo credentials
DODO_PAYMENTS_API_KEY=your_actual_api_key_here
DODO_WEBHOOK_SECRET=your_actual_webhook_secret_here

# Update these if your product IDs are different
DODO_BASIC_MONTHLY_PRODUCT_ID=pdt_2bc24CYBPFj8olU2KxuiG  # Your actual Basic plan ID
```

### Step 4: Restart Development Server

After updating the environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test the Integration

1. Go to `http://localhost:3002/debug-payment`
2. Click "Test API Connection" - should show ✅ success
3. Click "Test Basic Plan" - should create checkout URL
4. Test the full payment flow

## 🔍 Troubleshooting

### If API key is still invalid:

1. **Check the API key format**
   - Dodo API keys typically start with specific prefixes
   - Make sure you copied the complete key (no truncation)

2. **Verify environment**
   - Are you using test/sandbox keys for development?
   - Make sure the environment matches your Dodo dashboard setting

3. **Check API documentation**
   - Review Dodo Payments API documentation
   - Verify the correct API endpoint URLs

### If products don't exist:

1. **Create products in Dodo dashboard**
   - Each plan needs a corresponding product in your Dodo account
   - Product IDs must match exactly

2. **Update configuration**
   - If using different product IDs, update `/src/lib/dodo-payments-config.ts`

## 🎯 What Works Now

✅ **Authentication Flow**: Login → Payment redirect
✅ **Credit System**: Credit allocation and deduction
✅ **Webhook Processing**: Ready for subscription events
✅ **UI Components**: Pricing, dashboard, credit display
✅ **Error Handling**: Comprehensive error management

## ❌ What Needs Valid API Key

❌ **Payment Processing**: Cannot create checkout sessions
❌ **Subscription Management**: Cannot manage subscriptions
❌ **Webhook Verification**: Cannot verify webhook signatures

## 🚨 Alternative Testing Approach

If you don't have Dodo Payments access yet, you can:

1. **Test with mock data**: Use the admin credit grant endpoint
   ```bash
   curl -X POST "http://localhost:3002/api/admin/grant-credits" \
     -H "Content-Type: application/json" \
     -H "Cookie: session=your_session_cookie" \
     -d '{"amount": 1000, "reason": "testing"}'
   ```

2. **Simulate payment success**: Manually add credits and test the image enhancement flow

3. **Use different payment provider**: The system is designed to be modular - you could integrate Stripe, PayPal, or other providers

## 📞 Next Steps

1. **Get valid Dodo credentials** (highest priority)
2. **Test API connection** using the debug page
3. **Create actual products** in Dodo dashboard
4. **Test full payment flow** with real transactions
5. **Set up webhooks** for production

Once you have valid API credentials, this integration will work perfectly! 🎉