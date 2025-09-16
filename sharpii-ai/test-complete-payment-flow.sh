#!/bin/bash

echo "🧪 Testing Complete Payment Flow with New Tunnel"
echo "================================================"
echo ""

TUNNEL_URL="https://surrey-sacramento-research-phrase.trycloudflare.com"

echo "✅ STEP 1: Update Dodo Payments Dashboard"
echo "----------------------------------------"
echo "In your Dodo Payments dashboard, update the following:"
echo ""
echo "🔗 Webhook URL: ${TUNNEL_URL}/api/payments/webhook"
echo "📋 Events to subscribe:"
echo "   - payment.succeeded"
echo "   - payment.completed"
echo "   - payment.failed"
echo "   - checkout.session.completed"
echo ""
echo "🌐 Success URL: ${TUNNEL_URL}/app/dashboard?payment=success"
echo "❌ Cancel URL: ${TUNNEL_URL}/?payment=cancelled#pricing-section"
echo ""

echo "✅ STEP 2: Testing Webhook Endpoint"
echo "-----------------------------------"
WEBHOOK_RESPONSE=$(curl -s -X POST ${TUNNEL_URL}/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "dodo-signature: test-signature" \
  -d '{
    "type": "payment.succeeded",
    "data": {
      "payment_id": "test_payment_real",
      "amount": 80000,
      "currency": "INR", 
      "status": "completed",
      "metadata": {
        "userId": "real-test-user",
        "plan": "basic",
        "billingPeriod": "monthly",
        "credits": "1000"
      }
    }
  }' -w "\nHTTP Status: %{http_code}")

echo "Webhook test result:"
echo "$WEBHOOK_RESPONSE"
echo ""

echo "✅ STEP 3: Testing Return URLs"
echo "------------------------------"
SUCCESS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${TUNNEL_URL}/app/dashboard?payment=success)
echo "Success URL status: $SUCCESS_STATUS $([ '$SUCCESS_STATUS' = '200' ] && echo '✅' || echo '❌')"

CANCEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${TUNNEL_URL}/?payment=cancelled)
echo "Cancel URL status: $CANCEL_STATUS $([ '$CANCEL_STATUS' = '200' ] && echo '✅' || echo '❌')"
echo ""

echo "✅ STEP 4: Testing Checkout API"
echo "-------------------------------"
echo "Testing unauthenticated request (should return 401):"
CHECKOUT_STATUS=$(curl -s -X POST http://localhost:3002/api/payments/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "basic", "billingPeriod": "monthly"}' \
  -w "%{http_code}" -o /dev/null)
echo "Checkout API status: $CHECKOUT_STATUS $([ '$CHECKOUT_STATUS' = '401' ] && echo '✅ Correct (Auth Required)' || echo '❌ Unexpected')"
echo ""

echo "🔧 REQUIRED ACTIONS:"
echo "==================="
echo ""
echo "1. 🎯 UPDATE DODO DASHBOARD:"
echo "   Go to your Dodo Payments dashboard webhook settings"
echo "   Set webhook URL to: ${TUNNEL_URL}/api/payments/webhook"
echo ""
echo "2. 🧪 TEST REAL PAYMENT:"
echo "   - Visit: ${TUNNEL_URL}/debug-payment"
echo "   - Login with: rishaby304@gmail.com"
echo "   - Set test plan and click 'Test Checkout API'"
echo "   - Complete payment on Dodo checkout page"
echo "   - Should redirect to: ${TUNNEL_URL}/app/dashboard?payment=success"
echo ""
echo "3. 📊 VERIFY CREDITS:"
echo "   After successful payment, check dashboard for credit allocation"
echo ""
echo "🔍 DEBUGGING TIPS:"
echo "=================="
echo "- Check server logs for webhook processing"
echo "- Monitor Dodo dashboard for webhook success/failure"
echo "- Verify environment variables are loaded in the app"
echo ""
echo "Current tunnel: $TUNNEL_URL"
echo "⚠️  Remember: Update the webhook URL in Dodo dashboard before testing!"