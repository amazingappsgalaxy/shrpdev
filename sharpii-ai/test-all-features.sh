#!/bin/bash

# SharpII AI - Comprehensive Testing Script
# This script tests all the major functionality including plan checkout, invoice downloads, and credits

echo "🚀 SharpII AI - Comprehensive Testing Suite"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3003"
TEST_EMAIL="test@sharpii.ai"
TEST_PASSWORD="testpass123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with colors
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to check if server is running
check_server() {
    log_info "Checking if server is running..."
    
    if curl -s -f "$BASE_URL" > /dev/null; then
        log_success "Server is running on $BASE_URL"
        return 0
    else
        log_error "Server is not running on $BASE_URL"
        log_info "Please start the server with: npm run dev -- -p 3003"
        exit 1
    fi
}

# Test API endpoints
test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    # Test health check
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/health" 2>/dev/null || echo "000")
    if [ "$response" != "000" ]; then
        log_success "Health endpoint accessible"
    else
        log_warning "Health endpoint not found (optional)"
    fi
    
    # Test credit packages endpoint
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/credits/purchase" 2>/dev/null)
    if [ "$response" = "200" ]; then
        log_success "Credit packages endpoint working"
    else
        log_error "Credit packages endpoint failed (HTTP $response)"
    fi
    
    # Test webhook endpoint
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/payments/webhook" 2>/dev/null)
    if [ "$response" = "400" ]; then
        log_success "Webhook endpoint accessible (expects 400 without signature)"
    else
        log_warning "Webhook endpoint returned $response (expected 400)"
    fi
}

# Test plan configurations
test_plan_configs() {
    log_info "Testing plan configurations..."
    
    plans=("basic" "creator" "professional" "enterprise")
    billing_periods=("monthly" "yearly")
    
    success_count=0
    total_tests=0
    
    for plan in "${plans[@]}"; do
        for billing_period in "${billing_periods[@]}"; do
            total_tests=$((total_tests + 1))
            
            # Test checkout API (should fail with 401 - auth required)
            response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/payments/checkout" \
                -H "Content-Type: application/json" \
                -d "{\"plan\": \"$plan\", \"billingPeriod\": \"$billing_period\"}" 2>/dev/null)
            
            if [ "$response" = "401" ]; then
                log_success "$plan ($billing_period): Authentication required (correct)"
                success_count=$((success_count + 1))
            else
                log_error "$plan ($billing_period): Unexpected response $response"
            fi
        done
    done
    
    log_info "Plan tests: $success_count/$total_tests passed"
}

# Test invoice download functionality
test_invoice_download() {
    log_info "Testing invoice download functionality..."
    
    # Test with dummy payment ID
    test_payment_id="pay_test_123456"
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/billing/invoice/$test_payment_id/download" 2>/dev/null)
    
    if [ "$response" = "401" ]; then
        log_success "Invoice download requires authentication (correct)"
    else
        log_warning "Invoice download returned $response (expected 401)"
    fi
}

# Test Buy Credits functionality
test_buy_credits() {
    log_info "Testing Buy Credits functionality..."
    
    # Test GET request to credit packages
    packages_response=$(curl -s "$BASE_URL/api/credits/purchase" 2>/dev/null)
    
    if echo "$packages_response" | grep -q "packages"; then
        log_success "Credit packages API working"
        
        # Extract package info
        if echo "$packages_response" | grep -q "starter"; then
            log_success "Starter package available"
        fi
        if echo "$packages_response" | grep -q "popular"; then
            log_success "Popular package available"
        fi
        if echo "$packages_response" | grep -q "premium"; then
            log_success "Premium package available"
        fi
        if echo "$packages_response" | grep -q "ultimate"; then
            log_success "Ultimate package available"
        fi
    else
        log_error "Credit packages API not working"
    fi
    
    # Test POST request (should fail with 401)
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/credits/purchase" \
        -H "Content-Type: application/json" \
        -d '{"packageType": "starter"}' 2>/dev/null)
    
    if [ "$response" = "401" ]; then
        log_success "Credit purchase requires authentication (correct)"
    else
        log_warning "Credit purchase returned $response (expected 401)"
    fi
}

# Test dashboard components
test_dashboard_access() {
    log_info "Testing dashboard access..."
    
    # Test main dashboard
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/app/dashboard" 2>/dev/null)
    if [ "$response" = "200" ]; then
        log_success "Dashboard accessible"
    else
        log_error "Dashboard not accessible (HTTP $response)"
    fi
    
    # Test billing API
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/billing/payments" 2>/dev/null)
    if [ "$response" = "401" ]; then
        log_success "Billing API requires authentication (correct)"
    else
        log_warning "Billing API returned $response (expected 401)"
    fi
}

# Test pricing page functionality
test_pricing_page() {
    log_info "Testing pricing page..."
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/" 2>/dev/null)
    if [ "$response" = "200" ]; then
        log_success "Main pricing page accessible"
    else
        log_error "Main pricing page not accessible (HTTP $response)"
    fi
    
    # Test plans page
    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/plans" 2>/dev/null)
    if [ "$response" = "200" ]; then
        log_success "Plans page accessible"
    else
        log_warning "Plans page not accessible (HTTP $response)"
    fi
}

# Generate test report
generate_report() {
    echo ""
    echo "📊 Test Report Summary"
    echo "====================="
    echo ""
    
    log_info "Manual Testing Required:"
    echo "  1. 🔐 Authentication Flow:"
    echo "     - Visit: $BASE_URL/app/login"
    echo "     - Sign up with test account"
    echo "     - Verify login/logout works"
    echo ""
    
    echo "  2. 💳 Plan Selection:"
    echo "     - Visit: $BASE_URL"
    echo "     - Click 'Get Started' on Basic plan"
    echo "     - Should redirect to login if not authenticated"
    echo "     - After login, should redirect to payment"
    echo ""
    
    echo "  3. 🏪 Buy Credits:"
    echo "     - Go to Dashboard → Buy Credits tab"
    echo "     - Test different package selections"
    echo "     - Verify custom amount validation"
    echo ""
    
    echo "  4. 🧾 Invoice Download:"
    echo "     - Go to Dashboard → Billing tab"
    echo "     - Click download invoice button"
    echo "     - Should download PDF or HTML file"
    echo ""
    
    echo "  5. 🌐 Test Page Available:"
    echo "     - Visit: $BASE_URL/test-plans.html"
    echo "     - Test plan functionality directly"
    echo ""
    
    log_success "All automated tests completed!"
    log_info "Next: Run manual tests above to verify full functionality"
}

# Main execution
main() {
    check_server
    echo ""
    
    test_api_endpoints
    echo ""
    
    test_plan_configs
    echo ""
    
    test_invoice_download
    echo ""
    
    test_buy_credits
    echo ""
    
    test_dashboard_access
    echo ""
    
    test_pricing_page
    echo ""
    
    generate_report
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi