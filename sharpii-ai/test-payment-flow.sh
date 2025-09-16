#!/bin/bash

echo "🧪 Testing Complete Payment Flow"
echo "================================"

# Test webhook endpoint
echo "1. Testing webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -X POST https://view-ambassador-sorry-soc.trycloudflare.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "dodo-signature: test-signature" \
  -d '{
    "type": "payment.succeeded",
    "data": {
      "payment_id": "test_flow_123",
      "amount": 80000,
      "currency": "INR",
      "status": "completed",
      "metadata": {
        "userId": "test-flow-user",
        "plan": "basic",
        "billingPeriod": "monthly",
        "credits": "1000"
      }
    }
  }' -w "\nStatus: %{http_code}")

echo "Webhook response: $WEBHOOK_RESPONSE"

# Test success URL
echo "2. Testing success URL..."
SUCCESS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://view-ambassador-sorry-soc.trycloudflare.com/app/dashboard)
echo "Success URL status: $SUCCESS_STATUS"

# Test cancel URL
echo "3. Testing cancel URL..."
CANCEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://view-ambassador-sorry-soc.trycloudflare.com/?payment=cancelled)
echo "Cancel URL status: $CANCEL_STATUS"

# Test checkout API (should fail with 401 for unauthenticated)
echo "4. Testing checkout API..."
CHECKOUT_STATUS=$(curl -s -X POST http://localhost:3002/api/payments/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "basic", "billingPeriod": "monthly"}' \
  -w "%{http_code}" -o /dev/null)
echo "Checkout API status (should be 401): $CHECKOUT_STATUS"

echo ""
echo "✅ Summary:"
echo "- Webhook: $([ '$WEBHOOK_RESPONSE' == *'200'* ] && echo '✅ Working' || echo '❌ Failed')"
echo "- Success URL: $([ '$SUCCESS_STATUS' == '200' ] && echo '✅ Working' || echo '❌ Failed')"
echo "- Cancel URL: $([ '$CANCEL_STATUS' == '200' ] && echo '✅ Working' || echo '❌ Failed')" 
echo "- Checkout API: $([ '$CHECKOUT_STATUS' == '401' ] && echo '✅ Working (Auth Required)' || echo '❌ Failed')"
echo ""
echo "🔧 Next Steps:"
echo "1. Update Dodo Payments webhook URL: https://view-ambassador-sorry-soc.trycloudflare.com/api/payments/webhook"
echo "2. Test with real payment from the pricing page"
echo "3. Check browser console for detailed logs during payment flow"