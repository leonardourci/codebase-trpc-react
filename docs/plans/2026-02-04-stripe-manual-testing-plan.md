# Stripe Integration Manual Testing Plan

**Stripe Version**: v20.1.0
**Testing Environment**: localhost + Stripe CLI
**Date**: 2026-02-04

**Pricing Plans**:
- Free: $0 (free tier)
- Pro Monthly: $49.99/month
- Pro Yearly: $499.90/year (~17% savings)
- Enterprise Monthly: $99.99/month
- Enterprise Yearly: $999.90/year (~17% savings)

---

## Setup & Quick Reference

### Essential Commands

```bash
# Start Stripe CLI webhook forwarding
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test webhooks manually
stripe trigger <event_name>

# View recent Stripe events
stripe events list --limit 10

# Get customer details
stripe customers retrieve <customer_id>

# Get subscription details
stripe subscriptions retrieve <subscription_id>

# View logs in real-time
stripe logs tail

# Database queries (quick checks)
# Check user's current product
psql $DATABASE_URL -c "SELECT id, email, product_id FROM users WHERE email='test@example.com';"

# Check billing records
psql $DATABASE_URL -c "SELECT user_id, product_id, status, expires_at, external_subscription_id FROM billings WHERE user_id='<user_id>';"

# Check all products
psql $DATABASE_URL -c "SELECT name, price_in_cents, external_product_id, external_price_id, is_free_tier FROM products;"

# Join users with products to see current plan
psql $DATABASE_URL -c "SELECT u.email, p.name, p.price_in_cents FROM users u LEFT JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"

# Check billing with product info
psql $DATABASE_URL -c "SELECT b.status, b.expires_at, p.name as product, u.email FROM billings b JOIN users u ON b.user_id = u.id JOIN products p ON b.product_id = p.id WHERE u.email='test@example.com';"
```

### Environment Setup Checklist

- [ ] Backend running on `http://localhost:3000`
- [ ] Frontend running on `http://localhost:5173` (or your Vite port)
- [ ] PostgreSQL database running
- [ ] Stripe CLI installed and authenticated (`stripe login`)
- [ ] `.env` has valid `STRIPE_SECRET_KEY`
- [ ] Stripe CLI forwarding webhooks: `stripe listen --forward-to localhost:3000/webhooks/stripe`
- [ ] Copy webhook signing secret from CLI output to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## Test Plan Structure

Each test scenario includes:
1. **Pre-conditions**: What to set up
2. **Action**: What to do
3. **Expected Result**: What should happen
4. **Database Verification**: SQL queries to confirm
5. **Stripe Dashboard Check**: What to verify in Stripe
6. **Rollback/Cleanup**: How to reset for next test

---

## Test Suite 1: User Registration & Free Tier

### Test 1.1: New User Gets Free Tier by Default

**Pre-conditions:**
- Clean database or new test user email

**Action:**
```bash
# Register new user via frontend or API
# POST to registration endpoint
curl -X POST http://localhost:3000/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-free@example.com",
    "password": "Test123!",
    "fullName": "Test User",
    "phone": "1234567890",
    "age": 25
  }'
```

**Expected Result:**
- User created successfully
- User should have `product_id` pointing to Free tier product
- No billing record created yet (only when they subscribe to paid)

**Database Verification:**
```sql
-- Should show Free tier product
SELECT u.email, p.name, p.is_free_tier, p.price_in_cents
FROM users u
LEFT JOIN products p ON u.product_id = p.id
WHERE u.email = 'test-free@example.com';

-- Should return 0 rows (no billing for free tier)
SELECT * FROM billings WHERE user_id = (
  SELECT id FROM users WHERE email = 'test-free@example.com'
);
```

**Stripe Dashboard Check:**
- No customer created yet in Stripe

**Cleanup:**
```sql
DELETE FROM users WHERE email = 'test-free@example.com';
```

---

## Test Suite 2: Checkout Session Creation

### Test 2.1: Create Checkout Session for Pro Plan

**Pre-conditions:**
- User logged in with verified email
- Products seeded in database with real Stripe IDs

**Action:**
1. Navigate to pricing page in frontend
2. Click "Subscribe" on Pro plan ($49.99)
3. System should redirect to Stripe Checkout

**Alternative (API Test):**
```bash
# Get auth token first, then:
curl -X POST http://localhost:3000/trpc/billing.createCheckoutSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "priceId": "price_YOUR_PRO_ID",
    "successUrl": "http://localhost:5173/billing/success",
    "cancelUrl": "http://localhost:5173/pricing"
  }'
```

**Expected Result:**
- Checkout session created
- Returns session URL
- Redirects to Stripe Checkout page
- Shows Pro plan details ($49.99/month)

**Database Verification:**
```sql
-- User should still be on Free tier (not upgraded yet)
SELECT u.email, p.name
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
```

**Stripe Dashboard Check:**
- Go to Stripe Dashboard → Checkout Sessions
- Find the session just created
- Verify:
  - Status: `open`
  - Line items show correct price
  - Customer email matches

**Notes:**
- Checkout session expires after 24 hours if not completed
- Use Stripe test cards for completion testing

---

### Test 2.2: Verify Email Required for Checkout

**Pre-conditions:**
- User logged in but email NOT verified

**Action:**
- Try to create checkout session

**Expected Result:**
- Should fail with 403 Forbidden
- Error message: "Please verify your email before making a purchase"

**Database Verification:**
```sql
SELECT email, email_verified FROM users WHERE email = 'test@example.com';
-- email_verified should be false
```

---

## Test Suite 3: Successful Subscription Purchase

### Test 3.1: Complete Pro Plan Purchase

**Pre-conditions:**
- Checkout session created (Test 2.1)
- Stripe CLI webhook forwarding active
- User on Free tier

**Action:**
1. On Stripe Checkout page, use test card: `4242 4242 4242 4242`
2. Fill in:
   - Expiry: Any future date (e.g., 12/30)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Any name
3. Click "Subscribe"
4. Monitor Stripe CLI output for webhook events

**Expected Webhook Events (in order):**
```
✓ customer.created
✓ payment_method.attached
✓ customer.updated
✓ invoice.created
✓ invoice.finalized
✓ customer.subscription.created
✓ payment_intent.succeeded
✓ payment_intent.created
✓ charge.succeeded
✓ invoice.paid  ← This triggers our billing update
✓ invoice.payment_succeeded
✓ customer.subscription.updated
```

**Expected Result:**
- Checkout successful
- Redirected to success URL
- Frontend shows Pro plan as active

**Database Verification:**
```sql
-- User should now have Pro product
SELECT u.email, p.name, p.price_in_cents
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: name='Pro', price_in_cents=4999

-- Billing record should exist
SELECT
  b.status,
  b.expires_at,
  b.external_subscription_id,
  b.external_customer_id,
  p.name as product_name
FROM billings b
JOIN products p ON b.product_id = p.id
WHERE b.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='active', expires_at in future (~30 days), Pro product
```

**Stripe Dashboard Check:**
1. **Customers tab:**
   - Find customer by email
   - Should have active subscription
   - Note the `customer_id` (starts with `cus_`)

2. **Subscriptions tab:**
   - Find subscription
   - Status: `active`
   - Current period end date matches `expires_at` in database
   - Note the `subscription_id` (starts with `sub_`)

3. **Invoices tab:**
   - Should see paid invoice for Pro plan
   - Amount: $49.99
   - Status: `paid`

**Manual Verification Commands:**
```bash
# Get customer details
stripe customers retrieve <cus_xxx>

# Get subscription details
stripe subscriptions retrieve <sub_xxx>

# List customer's invoices
stripe invoices list --customer <cus_xxx>
```

**Cleanup (if needed):**
```bash
# Cancel subscription
stripe subscriptions cancel <sub_xxx>

# Or delete for cleanup
stripe subscriptions delete <sub_xxx>
```

---

### Test 3.2: Complete Enterprise Plan Purchase

**Same as Test 3.1 but:**
- Select Enterprise plan ($99.99)
- Verify correct price in database: `price_in_cents=9999`
- Verify correct product name: `name='Enterprise'`

---

## Test Suite 4: Subscription Updates

### Test 4.1: Subscription Renewal (Automatic)

**Pre-conditions:**
- Active Pro subscription

**Action:**
```bash
# Simulate subscription renewal
stripe trigger customer.subscription.updated

# Or manually in Stripe Dashboard:
# Subscriptions → Select subscription → Actions → Update subscription
```

**Expected Result:**
- `customer.subscription.updated` webhook received
- Database `expires_at` updated to new period end

**Database Verification:**
```sql
SELECT status, expires_at, updated_at
FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- expires_at should be updated to next billing cycle
```

**Stripe Dashboard Check:**
- Subscription → Current period end updated
- Status still `active`

---

### Test 4.2: User Cancels Subscription (Cancel at Period End)

**Pre-conditions:**
- Active Pro subscription

**Action:**
1. User navigates to customer portal (frontend billing page)
2. Click "Manage Subscription" button
3. In Stripe portal, click "Cancel subscription"
4. Choose "Cancel at period end"

**Alternative (Manual Trigger):**
```bash
# Cancel subscription at period end
stripe subscriptions update <sub_xxx> --cancel-at-period-end=true
```

**Expected Result:**
- Subscription marked for cancellation
- `customer.subscription.updated` webhook fired
- User retains access until period end

**Database Verification:**
```sql
SELECT status, expires_at
FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- status='active' (still active until expires_at)
-- expires_at = cancellation date (when access ends)
```

**Stripe Dashboard Check:**
- Subscription shows "Cancels on [date]"
- Status: `active` but marked for cancellation
- `cancel_at` field populated

---

### Test 4.3: Subscription Cancellation Immediately

**Pre-conditions:**
- Active Pro subscription

**Action:**
```bash
# Cancel immediately
stripe subscriptions cancel <sub_xxx>
```

**Expected Result:**
- `customer.subscription.deleted` webhook fired
- Billing status set to `canceled`
- User reverted to Free tier

**Database Verification:**
```sql
-- User should be back on Free tier
SELECT u.email, p.name, p.is_free_tier
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: name='Free', is_free_tier=true

-- Billing should be canceled
SELECT status, expires_at
FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='canceled', expires_at=NOW (or very recent)
```

**Stripe Dashboard Check:**
- Subscription status: `canceled`
- Customer still exists but no active subscription

---

## Test Suite 5: Payment Failures

### Test 5.1: Failed Payment (Insufficient Funds)

**Pre-conditions:**
- Active subscription

**Action:**
```bash
# Trigger payment failure
stripe trigger invoice.payment_failed

# Or manually:
# 1. Update payment method to test card that declines: 4000 0000 0000 0341
# 2. Create invoice manually and attempt payment
```

**Expected Result:**
- `invoice.payment_failed` webhook received
- Billing status updated to `past_due`

**Database Verification:**
```sql
SELECT status, expires_at
FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='past_due'
```

**Stripe Dashboard Check:**
- Subscription status: `past_due`
- Invoice status: `open` (unpaid)
- Stripe will retry payment automatically (based on retry settings)

**Notes:**
- Stripe typically retries failed payments 3-4 times over 2 weeks
- After final retry failure, subscription is canceled

---

### Test 5.2: Payment Retry Success

**Pre-conditions:**
- Subscription in `past_due` status

**Action:**
1. Update payment method to valid card in Stripe portal
2. Stripe automatically retries payment

**Alternative:**
```bash
# Manually retry invoice payment
stripe invoices pay <inv_xxx>
```

**Expected Result:**
- `invoice.paid` webhook fired
- Billing status back to `active`

**Database Verification:**
```sql
SELECT status, expires_at
FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='active', expires_at updated
```

---

## Test Suite 6: Customer Portal

### Test 6.1: Access Customer Portal

**Pre-conditions:**
- User has active or past subscription (billing record exists)

**Action:**
1. Navigate to billing page in frontend
2. Click "Manage Subscription" button
3. Should redirect to Stripe Customer Portal

**Alternative (API Test):**
```bash
curl -X POST http://localhost:3000/trpc/billing.createCustomerPortalSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "returnUrl": "http://localhost:5173/billing"
  }'
```

**Expected Result:**
- Portal session URL returned
- User redirected to Stripe portal
- Can view/manage subscription, update payment method, view invoices

**Portal Capabilities Test:**
- [ ] Update payment method
- [ ] View invoice history
- [ ] Cancel subscription
- [ ] Download invoices
- [ ] View upcoming invoice

---

### Test 6.2: Portal Access Without Billing Record

**Pre-conditions:**
- User on Free tier (no billing record)

**Action:**
- Try to access customer portal

**Expected Result:**
- Should fail with 404 "User billing not found"

---

## Test Suite 7: Edge Cases & Error Scenarios

### Test 7.1: Duplicate Subscription Attempt

**Pre-conditions:**
- User already has active Pro subscription

**Action:**
- Try to create another checkout session for Pro plan

**Expected Result:**
- Should succeed (Stripe allows this)
- On completion, should update existing billing record, not create duplicate

**Database Verification:**
```sql
-- Should only have ONE billing record per user
SELECT COUNT(*)
FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: 1
```

---

### Test 7.2: Webhook Signature Verification Failure

**Pre-conditions:**
- Stripe CLI webhook forwarding stopped

**Action:**
```bash
# Send webhook with invalid signature
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid" \
  -d '{
    "type": "invoice.paid",
    "data": {}
  }'
```

**Expected Result:**
- Request rejected with 400 Bad Request
- Error: "Invalid webhook signature"

**Backend Logs Check:**
- Should log signature verification failure

---

### Test 7.3: Webhook for Unknown Product ID

**Pre-conditions:**
- Invoice paid event with product not in database

**Action:**
```bash
# Manually create product in Stripe that's not seeded in DB
# Complete checkout for that product
```

**Expected Result:**
- Webhook processing fails
- Error: `Product with external ID "..." not found`
- Returns 500 (so Stripe retries)

**Database Verification:**
```sql
-- Billing should NOT be created/updated
SELECT * FROM billings WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
```

**Note:**
- Stripe will retry this webhook
- Fix by seeding the missing product, then let Stripe retry

---

### Test 7.4: Webhook for Non-Existent User Email

**Pre-conditions:**
- Complete checkout with email not in your database

**Action:**
- Create checkout session for email `nonexistent@example.com`
- Complete payment

**Expected Result:**
- `invoice.paid` webhook received
- Processing fails with error: `User with email "..." not found`
- Returns 500 (Stripe retries)

---

## Test Suite 8: Database Consistency

### Test 8.1: User Product ID Matches Billing Product ID

**Action:**
```sql
-- Check for mismatches
SELECT
  u.email,
  u.product_id as user_product_id,
  b.product_id as billing_product_id,
  p1.name as user_product_name,
  p2.name as billing_product_name
FROM users u
JOIN billings b ON u.id = b.user_id
LEFT JOIN products p1 ON u.product_id = p1.id
LEFT JOIN products p2 ON b.product_id = p2.id
WHERE u.product_id != b.product_id;
```

**Expected Result:**
- Should return 0 rows (no mismatches)

---

### Test 8.2: Billing Expires At Matches Stripe Subscription

**Action:**
```sql
-- Get billing expires_at
SELECT
  u.email,
  b.expires_at,
  b.external_subscription_id
FROM billings b
JOIN users u ON b.user_id = u.id;
```

Then for each subscription:
```bash
stripe subscriptions retrieve <sub_xxx> | grep current_period_end
```

**Expected Result:**
- `expires_at` in DB should match `current_period_end` in Stripe (unix timestamp converted to date)

---

### Test 8.3: Orphaned Billing Records

**Action:**
```sql
-- Check for billing records without valid users
SELECT b.*, u.email
FROM billings b
LEFT JOIN users u ON b.user_id = u.id
WHERE u.id IS NULL;
```

**Expected Result:**
- Should return 0 rows (all billings have valid users)

---

## Test Suite 9: Plan Upgrades & Downgrades

### Test 9.1: Upgrade from Pro to Enterprise

**Pre-conditions:**
- Active Pro subscription

**Action:**
1. Go to customer portal
2. Click "Update plan"
3. Select Enterprise
4. Confirm upgrade

**Alternative:**
```bash
# Upgrade subscription
stripe subscriptions update <sub_xxx> \
  --items[0][id]=<subscription_item_id> \
  --items[0][price]=price_YOUR_ENTERPRISE_ID
```

**Expected Result:**
- `invoice.paid` webhook for prorated amount
- `customer.subscription.updated` webhook
- User upgraded to Enterprise

**Database Verification:**
```sql
SELECT u.email, p.name, p.price_in_cents, b.status
FROM users u
JOIN products p ON u.product_id = p.id
JOIN billings b ON b.user_id = u.id
WHERE u.email = 'test@example.com';
-- Expected: name='Enterprise', price_in_cents=9999, status='active'
```

**Stripe Dashboard Check:**
- Subscription shows Enterprise plan
- Invoice shows proration credit for unused Pro time
- Invoice shows charge for Enterprise

---

### Test 9.2: Downgrade from Enterprise to Pro

**Same process as 9.1 but:**
- Select Pro instead of Enterprise
- Verify proration credit issued
- Verify database updated to Pro

**Note:**
- Downgrades typically take effect at next billing cycle
- Check Stripe Dashboard → Subscription → Scheduled changes

---

## Test Suite 10: Yearly Subscription Testing

### Test 10.1: Purchase Pro Yearly Plan

**Pre-conditions:**
- User logged in with verified email
- User on Free tier
- Products seeded with real Stripe yearly price IDs

**Action:**
1. Navigate to pricing page
2. Toggle to "Yearly" billing period
3. Click "Subscribe" on Pro Yearly plan ($499.90/year)
4. Complete checkout with test card `4242 4242 4242 4242`

**Alternative (API Test):**
```bash
curl -X POST http://localhost:3000/trpc/billing.createCheckoutSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "priceId": "price_YOUR_PRO_YEARLY_ID",
    "successUrl": "http://localhost:5173/billing/success",
    "cancelUrl": "http://localhost:5173/pricing"
  }'
```

**Expected Result:**
- Checkout session created for $499.90
- `invoice.paid` webhook received
- User upgraded to Pro Yearly

**Database Verification:**
```sql
-- User should have Pro product (yearly version)
SELECT u.email, p.name, p.price_in_cents, p.external_price_id
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: name='Pro', price_in_cents=49990, external_price_id='price_YOUR_PRO_YEARLY_ID'

-- Check expires_at is ~365 days from now
SELECT
  b.status,
  b.expires_at,
  b.expires_at - NOW() as time_until_expiry,
  p.name as product_name,
  p.price_in_cents
FROM billings b
JOIN products p ON b.product_id = p.id
WHERE b.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='active', time_until_expiry ~ '365 days'
```

**Stripe Dashboard Check:**
- Subscription interval: `year`
- Current period end: ~365 days from now
- Amount: $499.90
- Next invoice date: 1 year from now

**Verification Commands:**
```bash
# Get subscription details
stripe subscriptions retrieve <sub_xxx>
# Look for: "interval": "year"

# Check subscription interval
stripe subscriptions retrieve <sub_xxx> | grep -A2 "plan"
```

---

### Test 10.2: Purchase Enterprise Yearly Plan

**Same as Test 10.1 but:**
- Select Enterprise Yearly ($999.90/year)
- Verify `price_in_cents=99990`
- Verify `external_price_id='price_YOUR_ENTERPRISE_YEARLY_ID'`
- Verify expires_at is ~365 days out

---

### Test 10.3: Switch from Monthly to Yearly (Same Tier)

**Pre-conditions:**
- User has active Pro Monthly subscription ($49.99/month)

**Action:**
1. Go to customer portal
2. Click "Update plan"
3. Select Pro Yearly ($499.90/year)
4. Confirm change

**Alternative (Direct Stripe API):**
```bash
# Update subscription to yearly price
stripe subscriptions update <sub_xxx> \
  --items[0][id]=<subscription_item_id> \
  --items[0][price]=price_YOUR_PRO_YEARLY_ID
```

**Expected Result:**
- `invoice.paid` webhook for prorated amount
- `customer.subscription.updated` webhook
- User switched to Pro Yearly

**Database Verification:**
```sql
-- Product should now be Pro Yearly
SELECT u.email, p.name, p.price_in_cents, p.external_price_id
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: price_in_cents=49990 (yearly), external_price_id has 'YEARLY'

-- expires_at should be ~365 days from now
SELECT
  b.status,
  b.expires_at,
  DATE_PART('day', b.expires_at - NOW()) as days_until_expiry
FROM billings b
WHERE b.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: days_until_expiry ~ 365
```

**Stripe Dashboard Check:**
- Subscription now shows yearly interval
- Invoice shows:
  - Credit for unused monthly time (prorated)
  - Charge for yearly subscription
- Current period end: 1 year from now

**Financial Calculation Check:**
```
Example proration calculation:
- Had: Pro Monthly $49.99/month
- Used 10 days of 30-day period
- Unused: 20 days = ~$33.33 credit
- New charge: $499.90 (yearly)
- Invoice total: $499.90 - $33.33 = ~$466.57
```

**Verify in Stripe:**
```bash
# List customer invoices to see proration
stripe invoices list --customer <cus_xxx> --limit 5
```

---

### Test 10.4: Switch from Yearly to Monthly (Same Tier)

**Pre-conditions:**
- User has active Pro Yearly subscription

**Action:**
1. Go to customer portal
2. Click "Update plan"
3. Select Pro Monthly ($49.99/month)
4. Confirm change

**Expected Result:**
- `customer.subscription.updated` webhook
- **Important:** Downgrade typically scheduled for end of current period
- User keeps yearly access until period ends, then switches to monthly

**Database Verification (Immediately After):**
```sql
-- Should still show Pro Yearly until period ends
SELECT u.email, p.name, p.price_in_cents
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: Still price_in_cents=49990 (yearly)
```

**Stripe Dashboard Check:**
- Subscription shows "Scheduled update"
- Current plan: Pro Yearly
- Changes to: Pro Monthly on [end of period date]
- No immediate charge (credit will be lost)

**Note:**
- Stripe typically doesn't prorate downgrades
- User paid for full year, gets full year
- After year ends, switches to monthly billing

**To test immediate effect:**
```bash
# Force immediate change (not default behavior)
stripe subscriptions update <sub_xxx> \
  --items[0][id]=<subscription_item_id> \
  --items[0][price]=price_YOUR_PRO_MONTHLY_ID \
  --proration-behavior=always_invoice
```

---

### Test 10.5: Yearly Subscription Renewal

**Pre-conditions:**
- User has active Pro Yearly subscription
- Subscription approaching renewal date

**Action:**
```bash
# Simulate upcoming invoice
stripe invoices create --customer <cus_xxx> --auto-advance=true

# Or trigger renewal event
stripe trigger customer.subscription.updated
```

**Expected Result:**
- `invoice.paid` webhook fires
- `customer.subscription.updated` webhook
- Billing `expires_at` extended by another 365 days
- User charged $499.90

**Database Verification:**
```sql
-- expires_at should be extended
SELECT
  b.status,
  b.expires_at,
  b.updated_at,
  DATE_PART('day', b.expires_at - NOW()) as days_until_expiry
FROM billings b
WHERE b.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: days_until_expiry ~ 365 (reset to full year)
```

**Stripe Dashboard Check:**
- New invoice created for $499.90
- Invoice status: paid
- Subscription current_period_end: advanced by 1 year

---

### Test 10.6: Cancel Yearly Subscription (At Period End)

**Pre-conditions:**
- User has active Pro Yearly subscription with 6 months remaining

**Action:**
1. Go to customer portal
2. Click "Cancel subscription"
3. Select "Cancel at end of period"

**Alternative:**
```bash
stripe subscriptions update <sub_xxx> --cancel-at-period-end=true
```

**Expected Result:**
- `customer.subscription.updated` webhook
- Subscription marked for cancellation
- User retains access for remaining 6 months

**Database Verification:**
```sql
SELECT
  b.status,
  b.expires_at,
  DATE_PART('day', b.expires_at - NOW()) as days_remaining
FROM billings b
WHERE b.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='active', days_remaining ~ 180 (6 months)
```

**Stripe Dashboard Check:**
- Subscription status: `active`
- Shows "Cancels on [date]"
- `cancel_at_period_end`: true

**After Period Ends:**
```sql
-- User should be back on Free tier
SELECT u.email, p.name, p.is_free_tier
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: name='Free', is_free_tier=true

-- Billing should be canceled
SELECT status, expires_at FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='canceled'
```

---

### Test 10.7: Upgrade from Monthly to Yearly Different Tier

**Pre-conditions:**
- User has active Pro Monthly subscription

**Action:**
1. Go to customer portal (or pricing page)
2. Select Enterprise Yearly ($999.90/year)
3. Complete upgrade

**Alternative:**
```bash
stripe subscriptions update <sub_xxx> \
  --items[0][id]=<subscription_item_id> \
  --items[0][price]=price_YOUR_ENTERPRISE_YEARLY_ID
```

**Expected Result:**
- `invoice.paid` webhook with prorated amount
- User upgraded to Enterprise Yearly
- Invoice shows:
  - Credit for unused Pro Monthly time
  - Charge for Enterprise Yearly

**Database Verification:**
```sql
SELECT u.email, p.name, p.price_in_cents
FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: name='Enterprise', price_in_cents=99990

-- Check 365-day expiry
SELECT DATE_PART('day', b.expires_at - NOW()) as days_until_expiry
FROM billings b
WHERE b.user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: days_until_expiry ~ 365
```

**Financial Calculation:**
```
Example:
- Had: Pro Monthly $49.99/month, used 10 days
- Unused credit: ~$33.33
- New: Enterprise Yearly $999.90
- Invoice: $999.90 - $33.33 = ~$966.57
```

---

### Test 10.8: Yearly Payment Failure

**Pre-conditions:**
- User has active Pro Yearly subscription
- Renewal coming up

**Action:**
```bash
# Update payment method to declining card
stripe customers update <cus_xxx> \
  --invoice-settings[default_payment_method]=pm_card_chargeDeclined

# Trigger payment failure
stripe trigger invoice.payment_failed
```

**Expected Result:**
- `invoice.payment_failed` webhook received
- Billing status: `past_due`
- Subscription still active but flagged

**Database Verification:**
```sql
SELECT status, expires_at FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='past_due'
```

**Stripe Dashboard Check:**
- Subscription status: `past_due`
- Open invoice for $499.90
- Stripe will retry payment

**Important Note:**
- Yearly subscriptions have same retry logic as monthly
- After final retry failure (~2 weeks), subscription canceled
- User loses access immediately after final failure

---

### Test 10.9: Prorated Refund for Yearly Cancellation

**Pre-conditions:**
- User has Pro Yearly subscription, paid $499.90
- Only 1 month into 12-month period

**Action:**
```bash
# Cancel immediately with proration
stripe subscriptions cancel <sub_xxx> --prorate=true
```

**Expected Result:**
- Subscription canceled immediately
- Prorated refund issued for unused 11 months

**Calculation:**
```
Paid: $499.90 for 12 months
Used: 1 month = ~$41.66
Unused: 11 months = ~$458.24
Refund: ~$458.24 credited to customer
```

**Stripe Dashboard Check:**
- Credit note issued
- Amount: ~$458.24
- Invoice shows proration details

**Database Verification:**
```sql
-- User back on Free tier
SELECT u.email, p.name FROM users u
JOIN products p ON u.product_id = p.id
WHERE u.email = 'test@example.com';
-- Expected: name='Free'

-- Billing canceled
SELECT status FROM billings
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: status='canceled'
```

**Note:**
- This is NOT default Stripe behavior
- By default, user keeps access until period end
- Prorated refund must be explicitly enabled

---

### Test 10.10: Database Consistency for Yearly Plans

**Action:**
```sql
-- Check all yearly subscriptions have correct expiry windows
SELECT
  u.email,
  p.name,
  p.price_in_cents,
  b.status,
  DATE_PART('day', b.expires_at - b.created_at) as subscription_days
FROM billings b
JOIN users u ON b.user_id = u.id
JOIN products p ON b.product_id = p.id
WHERE p.price_in_cents IN (49990, 99990)  -- Yearly plans
  AND b.status = 'active';

-- subscription_days should be ~365 for all active yearly subs
```

**Expected Result:**
- All yearly subscriptions have ~365 days between created_at and expires_at
- Status is 'active'
- Price matches yearly pricing (49990 or 99990)

---

## Test Suite 11: Webhook Resilience

### Test 11.1: Webhook Idempotency

**Action:**
1. Complete a subscription purchase
2. Find the `invoice.paid` webhook event ID
3. Replay the webhook manually:

```bash
# Get event ID from Stripe CLI output or Dashboard
stripe events resend <evt_xxx>
```

**Expected Result:**
- Webhook processes successfully (returns 200)
- Database not changed (no duplicate billing, no errors)
- Idempotent behavior

**Database Verification:**
```sql
-- Should still have only ONE billing record
SELECT COUNT(*) FROM billings WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
-- Expected: 1
```

---

### Test 11.2: Out-of-Order Webhook Delivery

**Scenario:**
Webhooks might arrive out of order (e.g., `subscription.updated` before `invoice.paid`)

**Action:**
1. Trigger `customer.subscription.updated` manually
2. Then trigger `invoice.paid`

```bash
stripe trigger customer.subscription.updated
# Wait a few seconds
stripe trigger invoice.paid
```

**Expected Result:**
- Both webhooks process successfully
- Final database state is consistent
- No race conditions or duplicate records

---

## Test Suite 12: Multiple Users Concurrently

### Test 12.1: Concurrent Subscriptions

**Action:**
1. Create 3 test users
2. Simultaneously purchase subscriptions for all 3
3. Monitor webhook processing

**Expected Result:**
- All webhooks process successfully
- Each user has correct billing record
- No database conflicts or race conditions

**Database Verification:**
```sql
SELECT u.email, p.name, b.status
FROM users u
LEFT JOIN billings b ON u.id = b.user_id
LEFT JOIN products p ON b.product_id = p.id
WHERE u.email IN ('test1@example.com', 'test2@example.com', 'test3@example.com');
-- All should show correct subscriptions
```

---

## Quick Sanity Check Checklist

Use this for quick verification after code changes:

- [ ] **Health check**: `curl http://localhost:3000/health`
- [ ] **Database has products**: `psql $DATABASE_URL -c "SELECT name, price_in_cents FROM products;"`
  - Should show 5 products: Free (0), Pro Monthly (4999), Pro Yearly (49990), Enterprise Monthly (9999), Enterprise Yearly (99990)
- [ ] **Stripe CLI connected**: Check for webhook forwarding message
- [ ] **Create checkout session (monthly)**: Test via frontend or API
- [ ] **Create checkout session (yearly)**: Test with yearly price ID
- [ ] **Complete purchase**: Use test card `4242 4242 4242 4242`
- [ ] **Verify invoice.paid webhook**: Check CLI output
- [ ] **Check database updated**: User on paid plan, billing record created
- [ ] **Verify expiry dates**: Monthly ~30 days, Yearly ~365 days
- [ ] **Access customer portal**: From frontend billing page
- [ ] **Switch billing period**: Monthly to Yearly or vice versa
- [ ] **Cancel subscription**: Verify user reverts to Free tier

---

## Test Card Reference

| Scenario | Card Number | Notes |
|----------|-------------|-------|
| Success | `4242 4242 4242 4242` | Always succeeds |
| Declined | `4000 0000 0000 0002` | Generic decline |
| Insufficient Funds | `4000 0000 0000 9995` | Declined, insufficient funds |
| Expired Card | `4000 0000 0000 0069` | Expired card |
| 3D Secure Required | `4000 0025 0000 3155` | Requires authentication |
| CVC Check Fail | `4000 0000 0000 0127` | CVC check fails |

All test cards:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any valid ZIP

Full list: https://stripe.com/docs/testing#cards

---

## Troubleshooting Guide

### Webhook Not Received

**Check:**
1. Stripe CLI running: `stripe listen --forward-to localhost:3000/webhooks/stripe`
2. Backend running on correct port (3000)
3. Webhook endpoint correct: `/webhooks/stripe`
4. Check Stripe CLI logs for forwarding errors

**Fix:**
```bash
# Restart Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# Check backend logs
# Verify STRIPE_WEBHOOK_SECRET in .env matches CLI output
```

---

### Database Not Updating

**Check:**
1. Webhook signature valid
2. Product exists in database with matching `external_product_id`
3. User exists with email from invoice
4. Check backend logs for errors

**Debug:**
```bash
# Check products in DB
psql $DATABASE_URL -c "SELECT external_product_id, external_price_id FROM products;"

# Check Stripe product IDs match
stripe products list
stripe prices list
```

---

### "Product not found" Error

**Cause:**
- Stripe product ID in invoice doesn't match any in database

**Fix:**
1. Update `shared/config/pricing.config.ts` with real Stripe IDs
2. Re-run seed: `npm run db:seed`
3. Retry webhook (Stripe auto-retries or manual resend)

---

### "User not found" Error

**Cause:**
- Email in Stripe invoice doesn't match any user in database

**Fix:**
- Ensure user exists: `psql $DATABASE_URL -c "SELECT email FROM users WHERE email='test@example.com';"`
- Create user if missing
- Retry webhook

---

### Subscription Shows in Stripe but Not in Database

**Check:**
1. Was `invoice.paid` webhook received? Check Stripe CLI logs
2. Check Stripe Dashboard → Developers → Webhooks → Events
3. Look for webhook failures

**Fix:**
- Find the `invoice.paid` event ID
- Resend: `stripe events resend <evt_xxx>`

---

## Post-Testing Cleanup

```bash
# Cancel all test subscriptions
stripe subscriptions list --limit 100 | grep "sub_" | xargs -I {} stripe subscriptions cancel {}

# Delete test customers (optional)
stripe customers list --limit 100 | grep "cus_" | xargs -I {} stripe customers delete {}

# Clean database
psql $DATABASE_URL -c "DELETE FROM billings; DELETE FROM users WHERE email LIKE 'test%@example.com';"

# Re-seed products
cd back-end && npm run db:seed
```

---

## Test Results Log Template

```
## Test Run: [Date]
Tester: [Name]
Stripe Version: 20.1.0
Environment: localhost

### Tests Passed:
- [ ] Test 1.1: New User Gets Free Tier
- [ ] Test 2.1: Create Checkout Session
- [ ] Test 3.1: Complete Pro Monthly Purchase
- [ ] Test 3.2: Complete Enterprise Monthly Purchase
- [ ] Test 4.1: Subscription Renewal
- [ ] Test 4.2: Cancel at Period End
- [ ] Test 4.3: Immediate Cancellation
- [ ] Test 5.1: Payment Failure
- [ ] Test 6.1: Customer Portal Access
- [ ] Test 8.1: DB Consistency Check
- [ ] Test 9.1: Plan Upgrade (Monthly)
- [ ] Test 10.1: Purchase Pro Yearly
- [ ] Test 10.2: Purchase Enterprise Yearly
- [ ] Test 10.3: Switch Monthly to Yearly
- [ ] Test 10.4: Switch Yearly to Monthly
- [ ] Test 10.5: Yearly Renewal
- [ ] Test 10.6: Cancel Yearly at Period End
- [ ] Test 10.10: Yearly DB Consistency
- [ ] Test 11.1: Webhook Idempotency

### Issues Found:
1. [Issue description]
   - Steps to reproduce
   - Expected vs Actual
   - Logs/Screenshots

### Notes:
[Any additional observations]
```

---

## Appendix: Database Schema Quick Reference

### users table
- `id` (uuid, PK)
- `email` (unique)
- `product_id` (uuid, FK to products) - Current active plan
- `email_verified` (boolean)

### products table
- `id` (uuid, PK)
- `name` (string) - "Free", "Pro", "Enterprise"
- `price_in_cents` (int) - 0, 4999 (Pro Monthly), 49990 (Pro Yearly), 9999 (Enterprise Monthly), 99990 (Enterprise Yearly)
- `external_product_id` (string) - Stripe product ID (same for monthly/yearly of same tier)
- `external_price_id` (string) - Stripe price ID (unique for each monthly/yearly variant)
- `is_free_tier` (boolean)
- `max_projects` (int, nullable)

**Note:** The database stores 5 product records:
1. Free (0 cents)
2. Pro Monthly (4999 cents) - external_price_id: price_YOUR_PRO_MONTHLY_ID
3. Pro Yearly (49990 cents) - external_price_id: price_YOUR_PRO_YEARLY_ID
4. Enterprise Monthly (9999 cents) - external_price_id: price_YOUR_ENTERPRISE_MONTHLY_ID
5. Enterprise Yearly (99990 cents) - external_price_id: price_YOUR_ENTERPRISE_YEARLY_ID

### billings table
- `id` (uuid, PK)
- `user_id` (uuid, FK to users)
- `product_id` (uuid, FK to products)
- `external_subscription_id` (string) - Stripe subscription ID
- `external_customer_id` (string) - Stripe customer ID
- `status` (string) - 'active', 'past_due', 'canceled'
- `expires_at` (timestamp)

---

## Appendix: Identifying Monthly vs Yearly Subscriptions

Since the `billings` table doesn't have a `billing_period` column, you can identify monthly vs yearly subscriptions by:

### Method 1: Price Amount
```sql
-- Monthly subscriptions: 4999 or 9999
-- Yearly subscriptions: 49990 or 99990
SELECT
  u.email,
  p.name,
  p.price_in_cents,
  CASE
    WHEN p.price_in_cents IN (49990, 99990) THEN 'YEARLY'
    WHEN p.price_in_cents IN (4999, 9999) THEN 'MONTHLY'
    ELSE 'FREE'
  END as billing_period,
  b.status,
  b.expires_at
FROM billings b
JOIN users u ON b.user_id = u.id
JOIN products p ON b.product_id = p.id
WHERE b.status = 'active';
```

### Method 2: External Price ID
```sql
-- Check if price ID contains 'YEARLY' or 'MONTHLY'
SELECT
  u.email,
  p.name,
  p.external_price_id,
  CASE
    WHEN p.external_price_id LIKE '%YEARLY%' THEN 'YEARLY'
    WHEN p.external_price_id LIKE '%MONTHLY%' THEN 'MONTHLY'
    ELSE 'FREE'
  END as billing_period
FROM billings b
JOIN users u ON b.user_id = u.id
JOIN products p ON b.product_id = p.id;
```

### Method 3: Time Until Expiry
```sql
-- Monthly: ~30 days, Yearly: ~365 days
SELECT
  u.email,
  p.name,
  p.price_in_cents,
  DATE_PART('day', b.expires_at - b.created_at) as subscription_days,
  CASE
    WHEN DATE_PART('day', b.expires_at - b.created_at) > 180 THEN 'YEARLY'
    WHEN DATE_PART('day', b.expires_at - b.created_at) > 0 THEN 'MONTHLY'
    ELSE 'UNKNOWN'
  END as billing_period_guess
FROM billings b
JOIN users u ON b.user_id = u.id
JOIN products p ON b.product_id = p.id
WHERE b.status = 'active';
```

### Quick Check: All Subscriptions by Type
```sql
SELECT
  CASE
    WHEN p.price_in_cents = 0 THEN 'Free'
    WHEN p.price_in_cents IN (4999, 9999) THEN 'Monthly Paid'
    WHEN p.price_in_cents IN (49990, 99990) THEN 'Yearly Paid'
  END as subscription_type,
  COUNT(*) as count,
  SUM(p.price_in_cents) / 100.0 as total_value_dollars
FROM billings b
JOIN products p ON b.product_id = p.id
WHERE b.status = 'active'
GROUP BY subscription_type;
```

---

**End of Testing Plan**

*Good luck with your testing! Remember to update the pricing.config.ts with your actual Stripe product/price IDs before running tests.*

**Important:** Before testing yearly plans, ensure you've:
1. Created yearly price objects in Stripe Dashboard (or via API)
2. Updated `shared/config/pricing.config.ts` with real yearly price IDs
3. Re-seeded the database: `cd back-end && npm run db:seed`
4. Verified 5 products exist in database (1 free + 2 monthly + 2 yearly)
