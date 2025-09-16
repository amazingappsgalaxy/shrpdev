#!/bin/bash

# Test Subscription Flow - Complete Test Script
echo "🧪 Testing Subscription Flow Integration"
echo "========================================"

BASE_URL="http://localhost:3002"

# Test 1: Check if server is running
echo ""
echo "1. Testing server availability..."
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL")

if [ "$response" = "200" ]; then
    echo "✅ Server is running on $BASE_URL"
else
    echo "❌ Server is not responding (HTTP $response)"
    exit 1
fi

# Test 2: Test unauthenticated checkout (should fail with 401)
echo ""
echo "2. Testing unauthenticated checkout (should fail)..."
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/payments/checkout" \
    -H "Content-Type: application/json" \
    -d '{"plan": "basic", "billingPeriod": "monthly"}' \
    -o /dev/null)

if [ "$response" = "401" ]; then
    echo "✅ Authentication protection working (HTTP 401)"
else
    echo "⚠️  Expected 401 but got HTTP $response"
fi

# Test 3: Test invalid plan
echo ""
echo "3. Testing invalid plan (should fail with 400)..."
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/payments/checkout" \
    -H "Content-Type: application/json" \
    -d '{"plan": "invalid", "billingPeriod": "monthly"}' \
    -o /dev/null)

if [ "$response" = "400" ] || [ "$response" = "401" ]; then
    echo "✅ Invalid plan rejected (HTTP $response)"
else
    echo "⚠️  Expected 400/401 but got HTTP $response"
fi

# Test 4: Test webhook endpoint
echo ""
echo "4. Testing webhook endpoint (should fail without signature)..."
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/payments/webhook" \
    -H "Content-Type: application/json" \
    -d '{"type": "test", "data": {}}' \
    -o /dev/null)

if [ "$response" = "400" ] || [ "$response" = "401" ]; then
    echo "✅ Webhook protection working (HTTP $response)"
else
    echo "⚠️  Expected 400/401 but got HTTP $response"
fi

# Test 5: Check if test page is accessible
echo ""
echo "5. Testing subscription test page..."
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/test-subscription-flow")

if [ "$response" = "200" ]; then
    echo "✅ Test page accessible at $BASE_URL/test-subscription-flow"
else
    echo "❌ Test page not accessible (HTTP $response)"
fi

# Test 6: Check if pricing page works
echo ""
echo "6. Testing pricing page..."
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/plans")

if [ "$response" = "200" ]; then
    echo "✅ Pricing page accessible at $BASE_URL/plans"
else
    echo "❌ Pricing page not accessible (HTTP $response)"
fi

echo ""
echo "🎯 Basic API Tests Complete!"
echo ""
echo "Next steps for manual testing:"
echo "==============================="
echo "1. Visit: $BASE_URL/test-subscription-flow"
echo "2. Login with your test account"
echo "3. Run the subscription tests"
echo "4. Click 'Open Checkout' for successful tests"
echo "5. Complete payment on Dodo checkout page"
echo "6. Verify webhooks are received and credits are allocated"
echo ""
echo "Expected Product IDs in Dodo Dashboard:"
echo "- Basic Monthly: pdt_2bc24CYBPFj8olU2KxuiG"
echo "- Creator Monthly: pdt_ALjMHf8bJnZD0GRtNnUAY" 
echo "- Creator Yearly: pdt_WNr5iJDaFOiDCXWKZWjX2"
echo ""
echo "🚀 Ready for testing!"