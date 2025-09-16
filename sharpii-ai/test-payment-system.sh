#!/bin/bash

echo "🎯 PAYMENT SYSTEM VALIDATION"
echo "============================="

TUNNEL_URL="https://divisions-ecommerce-estimated-virtue.trycloudflare.com"

echo "✅ STEP 1: Test Tunnel Connectivity"
echo "-----------------------------------"
TUNNEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $TUNNEL_URL)
echo "Tunnel status: $TUNNEL_STATUS $([ '$TUNNEL_STATUS' = '200' ] && echo '✅' || echo '❌')"

echo ""
echo "✅ STEP 2: Test Payment Completion Page"
echo "---------------------------------------"
COMPLETION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $TUNNEL_URL/payment-completion)
echo "Payment completion page: $COMPLETION_STATUS $([ '$COMPLETION_STATUS' = '200' ] && echo '✅' || echo '❌')"

echo ""
echo "✅ STEP 3: Test Recent Payments API"
echo "-----------------------------------"
RECENT_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TUNNEL_URL/api/payments/recent?userId=test&since=1")
echo "Recent payments API: $RECENT_API_STATUS"

echo ""
echo "✅ STEP 4: Test Webhook Endpoint"
echo "--------------------------------"
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $TUNNEL_URL/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "dodo-signature: test-dev" \
  -d '{"type": "payment.test"}')
echo "Webhook endpoint: $WEBHOOK_STATUS $([ '$WEBHOOK_STATUS' = '200' ] && echo '✅' || echo '❌')"

echo ""
echo "✅ STEP 5: Test Billing API Endpoints"
echo "-------------------------------------"
BILLING_PAYMENTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $TUNNEL_URL/api/billing/payments)
echo "Billing payments API: $BILLING_PAYMENTS_STATUS"

BILLING_INVOICES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $TUNNEL_URL/api/billing/invoices)
echo "Billing invoices API: $BILLING_INVOICES_STATUS"

echo ""
echo "🔧 CONFIGURATION STATUS"
echo "======================="
echo "Current tunnel: $TUNNEL_URL"
echo "Payment completion URL: $TUNNEL_URL/payment-completion"
echo "Return URL configured in env: $(grep DODO_PAYMENTS_RETURN_URL /Users/dheer/Documents/sharpcode/sharpii-ai/.env.local | cut -d'=' -f2)"

echo ""
echo "📋 RECOMMENDED ACTIONS"
echo "====================="
echo "1. Update Dodo webhook URL to: $TUNNEL_URL/api/payments/webhook"
echo "2. Ensure product success URL is: $TUNNEL_URL/payment-completion"
echo "3. Test real payment flow through your app"
echo "4. Monitor polling mechanism for payment detection"

echo ""
echo "🎉 System should now redirect users properly after payment completion!"