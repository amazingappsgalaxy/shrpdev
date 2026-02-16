# Comprehensive Billing System Implementation Plan

## Critical Fixes (Priority 1)
- [x] Fix duplicate credit grants in webhook handler
- [ ] Implement idempotency using payment_id/subscription_id
- [ ] Add unique constraint on payments table

## Credit System (Priority 1) 
- [ ] Separate subscription_credits (expire monthly) from permanent_credits
- [ ] Update database schema with expiry tracking
- [ ] Implement credit deduction hierarchy (subscription first, then permanent)
- [ ] Add RPC functions for atomic credit operations

## Billing Pages (Priority 2)
- [ ] Redesign dashboard with segmented control
- [ ] Show current plan or "No Plan" state
- [ ] Display total credits with hover tooltip (breakdown)
- [ ] Add "Top Up Credits" section (only for active subscribers)
- [ ] Payment history table with invoice download
- [ ] Upgrade/downgrade plan flow

## Usage Section (Priority 2)
- [ ] Show all transactions with task IDs
- [ ] Display debit/credit clearly
- [ ] Real-time updates when credits change

## Editor Integration (Priority 3)
- [ ] Show estimated credit cost before enhancement
- [ ] Debit credits on enhance button press
- [ ] Record task ID in transactions
- [ ] Block enhancement if insufficient credits
- [ ] Show upgrade popup when no credits

## Testing (Priority 4)
- [ ] Browser test complete flow
- [ ] Verify no duplicate credits
- [ ] Test credit deduction hierarchy
- [ ] Test all edge cases
