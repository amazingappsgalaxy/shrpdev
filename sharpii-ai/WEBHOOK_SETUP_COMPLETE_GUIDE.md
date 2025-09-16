# 🔗 Complete Webhook Setup Guide

## Current Webhook Configuration

**✅ Webhook URL (No Password Required):**
```
https://public-donuts-throw.loca.lt/api/payments/webhook
```

**✅ Webhook Secret (Already Added to Environment):**
```
whsec_CvW8M/rIMpywMbLC0HGysKxFXf2RrcRP
```

## Step-by-Step Webhook Setup in Dodo Dashboard

### Step 1: Access Dodo Dashboard
1. Go to your [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. Log in with your account credentials

### Step 2: Navigate to Webhooks
1. In the dashboard, find **Settings** or **Developer** section
2. Click on **Webhooks**
3. Click **Add Webhook** or **Create New Webhook**

### Step 3: Configure Webhook Endpoint
1. **Endpoint URL**: Enter exactly this URL:
   ```
   https://famous-views-like.loca.lt/api/payments/webhook
   ```
2. **Description**: "Local Development Webhook"
3. **Method**: POST (should be default)

### Step 4: Select Events to Subscribe
Select these specific events:
- ✅ `payment.succeeded` - When payment is completed
- ✅ `payment.failed` - When payment fails  
- ✅ `subscription.created` - When subscription is created
- ✅ `subscription.renewed` - When subscription renews
- ✅ `subscription.cancelled` - When subscription is cancelled

### Step 5: Save and Get Secret
1. Click **Save** or **Create Webhook**
2. Copy the webhook secret (should be: `whsec_CvW8M/rIMpywMbLC0HGysKxFXf2RrcRP`)
3. We already have this in your environment variables

### Step 6: Test Webhook
1. Look for a **Test** button in your webhook settings
2. Send a test event to verify connectivity
3. Check your terminal for incoming webhook requests

## Testing Webhook Reception

### Method 1: Check Terminal Output
When webhooks are received, you'll see logs like:
```
POST /api/payments/webhook
Headers: webhook-signature, webhook-id, webhook-timestamp
Body: { type: "payment.succeeded", data: {...} }
```

### Method 2: Use Debug Endpoint
Visit: `http://localhost:3002/debug-payment` and check logs

### Method 3: Manual Test
```bash
curl -X POST "https://famous-views-like.loca.lt/api/payments/webhook" \
  -H "Content-Type: application/json" \
  -H "webhook-signature: test" \
  -d '{"test": "webhook"}'
```

## Important Notes

### URL Changes
- The localtunnel URL `famous-views-like.loca.lt` is temporary
- If you restart the tunnel, you'll get a new URL
- **Remember to update the webhook URL in Dodo dashboard** when the URL changes

### Production Setup
For production, replace with your actual domain:
```
https://yourdomain.com/api/payments/webhook
```

### Security
- Our webhook endpoint verifies signatures using the secret
- Invalid signatures are rejected with 400 status
- All webhook events are logged for debugging

## Troubleshooting

### If webhook fails:
1. Check if the URL is accessible: Visit `https://famous-views-like.loca.lt`
2. Verify the endpoint: `https://famous-views-like.loca.lt/api/payments/webhook`
3. Check terminal for error logs
4. Ensure localtunnel is running: `npx localtunnel --port 3002`

### If you get 401 errors:
- Check that webhook secret matches exactly
- Verify the signature verification logic

### If URL becomes unavailable:
1. Restart localtunnel: `npx localtunnel --port 3002`
2. Get new URL from terminal output
3. Update webhook URL in Dodo dashboard

## Next Steps After Setup

1. ✅ Configure webhook in Dodo dashboard
2. ✅ Test webhook reception  
3. ✅ Complete a test payment
4. ✅ Verify credit allocation works
5. ✅ Check monthly credit expiration logic