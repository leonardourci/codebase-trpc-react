# Stripe Integration - Complete Testing Guide
**All Commands Included for Each Step**

---

## 🚀 Initial Setup

### Step 1: Start All Services

```h
# Terminal 1: Start backend
cd back-end && npm run dev

# Terminal 2: Start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/webhooks/stripe
# Copy the webhook signing secret from output

# Terminal 3: Start frontend (if needed)
cd front-end && npm run dev

# Terminal 4: Keep this open for commands
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Step 2: Verify Environment

```bash
# Check backend is running
curl http://localhost:3000/health

# Check database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Verify products are seeded
psql $DATABASE_URL -c "SELECT name, price_in_cents, external_price_id FROM products ORDER BY price_in_cents;"
```

Expected output: 5 products (Free, Pro Monthly, Pro Yearly, Enterprise Monthly, Enterprise Yearly)

---

## 📝 Test 1: User Registration & Free Tier

### Step 1.1: Register a new user

```bash
curl -X POST http://localhost:3000/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User",
    "phone": "1234567890",
    "age": 25
  }'
```

Expected: `{"success": true, ...}` or similar success response

### Step 1.2: Verify user created with Free tier

```bash
psql $DATABASE_URL -c "SELECT u.id, u.email, p.name as product, p.is_free_tier FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

Expected:
- User exists
- Product name = 'Free'
- is_free_tier = true

### Step 1.3: Verify NO billing record exists yet

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected: Count = 0

### Step 1.4: Verify no Stripe customer created yet

```bash
stripe customers list --email test@example.com
```

Expected: No customers found

---

## 💳 Test 2: Monthly Subscription Purchase

### Step 2.1: Login and get JWT token

```bash
# Via frontend: Login at http://localhost:5173/login
# Or via API:
curl -X POST http://localhost:3000/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
# Save the JWT token from response
```

### Step 2.2: Verify email (if needed)

```bash
# Check email_verified status
psql $DATABASE_URL -c "SELECT email, email_verified FROM users WHERE email='test@example.com';"

# If false, manually verify for testing:
psql $DATABASE_URL -c "UPDATE users SET email_verified = true WHERE email='test@example.com';"
```

### Step 2.3: Create checkout session

**Via Frontend:**
- Navigate to http://localhost:5173/pricing
- Click "Subscribe" on Pro Monthly plan

**Via API (alternative):**
```bash
# Replace <JWT_TOKEN> and <PRICE_ID> with actual values
curl -X POST http://localhost:3000/trpc/billing.createCheckoutSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "priceId": "price_YOUR_PRO_MONTHLY_ID",
    "successUrl": "http://localhost:5173/billing/success",
    "cancelUrl": "http://localhost:5173/pricing"
  }'
```

Expected: Checkout session URL returned

### Step 2.4: Complete checkout with test card

1. Open the checkout URL
2. Fill in:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/30`
   - CVC: `123`
   - Name: `Test User`
   - ZIP: `12345`
3. Click "Subscribe"

### Step 2.5: Monitor webhook events

Watch Terminal 2 (Stripe CLI) for:
```
✓ customer.created
✓ payment_method.attached
✓ invoice.created
✓ invoice.paid  ← This is the important one
✓ customer.subscription.created
```

### Step 2.6: Verify database updated

```bash
# Check user upgraded to Pro
psql $DATABASE_URL -c "SELECT u.email, p.name as product, p.price_in_cents FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

Expected:
- product = 'Pro'
- price_in_cents = 4999

```bash
# Check billing record created
psql $DATABASE_URL -c "SELECT user_id, product_id, status, expires_at, external_subscription_id, external_customer_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected:
- status = 'active'
- expires_at = ~30 days in future
- external_subscription_id starts with 'sub_'
- external_customer_id starts with 'cus_'

```bash
# Check expiry date is ~30 days
psql $DATABASE_URL -c "SELECT DATE_PART('day', expires_at - NOW()) as days_until_expiry FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected: days_until_expiry ≈ 29-31

### Step 2.7: Verify in Stripe Dashboard

```bash
# Get customer ID
CUSTOMER_ID=$(psql $DATABASE_URL -t -c "SELECT external_customer_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" | xargs)

# Get subscription ID
SUBSCRIPTION_ID=$(psql $DATABASE_URL -t -c "SELECT external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" | xargs)

# View customer details
stripe customers retrieve $CUSTOMER_ID

# View subscription details
stripe subscriptions retrieve $SUBSCRIPTION_ID
```

Expected subscription details:
- status: `active`
- plan.amount: 4999
- current_period_end: ~30 days from now

### Step 2.8: Save IDs for next tests

```bash
echo "CUSTOMER_ID=$CUSTOMER_ID"
echo "SUBSCRIPTION_ID=$SUBSCRIPTION_ID"
```

---

## 🔄 Test 3: Subscription Renewal

### Step 3.1: Simulate subscription updated event

```bash
stripe trigger customer.subscription.updated
```

### Step 3.2: Check webhook received

Watch Terminal 2 for:
```
✓ customer.subscription.updated
```

### Step 3.3: Verify database updated

```bash
psql $DATABASE_URL -c "SELECT status, expires_at, updated_at FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected:
- status = 'active'
- updated_at refreshed to recent timestamp

---

## ❌ Test 4: Subscription Cancellation (At Period End)

### Step 4.1: Cancel subscription at period end

```bash
stripe subscriptions update $SUBSCRIPTION_ID --cancel-at-period-end=true
```

### Step 4.2: Check webhook received

Watch Terminal 2 for:
```
✓ customer.subscription.updated
```

### Step 4.3: Verify subscription marked for cancellation

```bash
stripe subscriptions retrieve $SUBSCRIPTION_ID | grep cancel_at_period_end
```

Expected: `"cancel_at_period_end": true`

### Step 4.4: Verify database - user still has access

```bash
psql $DATABASE_URL -c "SELECT u.email, p.name, b.status, b.expires_at FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"
```

Expected:
- product name = 'Pro' (still has access)
- status = 'active' (until expires_at)
- expires_at = original expiry date

### Step 4.5: Simulate period end - cancel immediately

```bash
stripe subscriptions cancel $SUBSCRIPTION_ID
```

### Step 4.6: Check webhook received

Watch Terminal 2 for:
```
✓ customer.subscription.deleted
```

### Step 4.7: Verify user downgraded to Free tier

```bash
psql $DATABASE_URL -c "SELECT u.email, p.name, p.is_free_tier FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

Expected:
- product name = 'Free'
- is_free_tier = true

### Step 4.8: Verify billing record marked canceled

```bash
psql $DATABASE_URL -c "SELECT status, expires_at FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected:
- status = 'canceled'
- expires_at = recent timestamp (now)

---

## 🔁 Test 5: Resubscription (After Cancellation)

### Step 5.1: Verify user is on Free tier

```bash
psql $DATABASE_URL -c "SELECT u.email, p.name, b.external_customer_id FROM users u JOIN products p ON u.product_id = p.id LEFT JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"
```

Expected:
- product name = 'Free'
- external_customer_id should still exist (from previous subscription)

### Step 5.2: Save existing customer ID

```bash
EXISTING_CUSTOMER_ID=$(psql $DATABASE_URL -t -c "SELECT external_customer_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" | xargs)
echo "Existing Customer ID: $EXISTING_CUSTOMER_ID"
```

### Step 5.3: Create new checkout session

**Via Frontend:**
- Navigate to pricing page
- Click "Subscribe" on Pro Monthly again

**Via API:**
```bash
curl -X POST http://localhost:3000/trpc/billing.createCheckoutSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "priceId": "price_YOUR_PRO_MONTHLY_ID",
    "successUrl": "http://localhost:5173/billing/success",
    "cancelUrl": "http://localhost:5173/pricing"
  }'
```

### Step 5.4: Complete checkout

Complete checkout with test card: `4242 4242 4242 4242`

### Step 5.5: Verify SAME customer ID reused

```bash
NEW_CUSTOMER_ID=$(psql $DATABASE_URL -t -c "SELECT external_customer_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" | xargs)
echo "New Customer ID: $NEW_CUSTOMER_ID"

# Compare
if [ "$EXISTING_CUSTOMER_ID" = "$NEW_CUSTOMER_ID" ]; then
  echo "✅ SUCCESS: Same customer ID reused"
else
  echo "❌ FAIL: Different customer ID created (duplicate customer)"
fi
```

Expected: ✅ Same customer ID

### Step 5.6: Verify NEW subscription created

```bash
NEW_SUBSCRIPTION_ID=$(psql $DATABASE_URL -t -c "SELECT external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" | xargs)
echo "New Subscription ID: $NEW_SUBSCRIPTION_ID"

# Should be different from old subscription
if [ "$SUBSCRIPTION_ID" != "$NEW_SUBSCRIPTION_ID" ]; then
  echo "✅ SUCCESS: New subscription created"
else
  echo "❌ FAIL: Same subscription ID (this shouldn't happen)"
fi
```

Expected: ✅ Different subscription ID

### Step 5.7: Verify only ONE customer exists in Stripe

```bash
stripe customers list --email test@example.com --limit 10
```

Expected: Exactly 1 customer returned

### Step 5.8: Update subscription ID for next tests

```bash
SUBSCRIPTION_ID=$NEW_SUBSCRIPTION_ID
```

---

## 💰 Test 6: Yearly Subscription Purchase

### Step 6.1: Cancel current monthly subscription

```bash
stripe subscriptions cancel $SUBSCRIPTION_ID
```

Wait for webhook and verify downgrade to free tier:

```bash
psql $DATABASE_URL -c "SELECT p.name FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

Expected: name = 'Free'

### Step 6.2: Create checkout for Pro Yearly

**Via Frontend:**
- Navigate to pricing page
- Toggle to "Yearly" billing
- Click "Subscribe" on Pro Yearly ($499.90/year)

**Via API:**
```bash
curl -X POST http://localhost:3000/trpc/billing.createCheckoutSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "priceId": "price_YOUR_PRO_YEARLY_ID",
    "successUrl": "http://localhost:5173/billing/success",
    "cancelUrl": "http://localhost:5173/pricing"
  }'
```

### Step 6.3: Complete checkout

Complete checkout with test card: `4242 4242 4242 4242`

### Step 6.4: Verify yearly subscription created

```bash
psql $DATABASE_URL -c "SELECT u.email, p.name, p.price_in_cents, DATE_PART('day', b.expires_at - NOW()) as days_until_expiry FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"
```

Expected:
- product name = 'Pro'
- price_in_cents = 49990
- days_until_expiry ≈ 365

### Step 6.5: Verify in Stripe

```bash
SUBSCRIPTION_ID=$(psql $DATABASE_URL -t -c "SELECT external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" | xargs)

stripe subscriptions retrieve $SUBSCRIPTION_ID | grep -E "(interval|amount)"
```

Expected:
- interval: "year"
- amount: 49990

---

## 🔀 Test 7: Plan Change (Yearly → Monthly)

### Step 7.1: Get current subscription details

```bash
stripe subscriptions retrieve $SUBSCRIPTION_ID
# Note the subscription_item_id from items.data[0].id
```

### Step 7.2: Update subscription to monthly

```bash
# Get subscription item ID
ITEM_ID=$(stripe subscriptions retrieve $SUBSCRIPTION_ID --format json | grep -oP '"id":\s*"\K[^"]+' | head -2 | tail -1)

# Update to monthly price
stripe subscriptions update $SUBSCRIPTION_ID \
  --items[0][id]=$ITEM_ID \
  --items[0][price]=price_YOUR_PRO_MONTHLY_ID
```

### Step 7.3: Check webhooks received

Watch Terminal 2 for:
```
✓ customer.subscription.updated
✓ invoice.paid (for prorated amount)
```

### Step 7.4: Verify database updated to monthly

```bash
psql $DATABASE_URL -c "SELECT p.name, p.price_in_cents, DATE_PART('day', b.expires_at - NOW()) as days FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"
```

Expected:
- price_in_cents = 4999 (monthly)
- days ≈ 30

### Step 7.5: Verify proration in Stripe

```bash
# List recent invoices to see proration
CUSTOMER_ID=$(psql $DATABASE_URL -t -c "SELECT external_customer_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" | xargs)

stripe invoices list --customer $CUSTOMER_ID --limit 3
```

Expected: Latest invoice shows proration credit and new charge

---

## 📈 Test 8: Plan Upgrade (Pro → Enterprise)

### Step 8.1: Update subscription to Enterprise

```bash
ITEM_ID=$(stripe subscriptions retrieve $SUBSCRIPTION_ID --format json | grep -oP '"id":\s*"\K[^"]+' | head -2 | tail -1)

stripe subscriptions update $SUBSCRIPTION_ID \
  --items[0][id]=$ITEM_ID \
  --items[0][price]=price_YOUR_ENTERPRISE_MONTHLY_ID
```

### Step 8.2: Verify database updated

```bash
psql $DATABASE_URL -c "SELECT p.name, p.price_in_cents FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

Expected:
- name = 'Enterprise'
- price_in_cents = 9999

---

## ⚠️ Test 9: Payment Failure

### Step 9.1: Trigger payment failure

```bash
stripe trigger invoice.payment_failed
```

### Step 9.2: Check webhook received

Watch Terminal 2 for:
```
✓ invoice.payment_failed
```

### Step 9.3: Verify status changed to past_due

```bash
psql $DATABASE_URL -c "SELECT status, expires_at FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected:
- status = 'past_due'
- expires_at = unchanged (keeps original expiry)

### Step 9.4: Verify user still has access (during retry period)

```bash
psql $DATABASE_URL -c "SELECT u.email, p.name FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

Expected: Still on paid plan (Enterprise)

### Step 9.5: Simulate payment retry success

```bash
stripe trigger invoice.paid
```

### Step 9.6: Verify status back to active

```bash
psql $DATABASE_URL -c "SELECT status FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected: status = 'active'

---

## 🚫 Test 10: Payment Retries Exhausted

### Step 10.1: Simulate all retries failed

```bash
# Update subscription status to canceled (simulating retry exhaustion)
stripe subscriptions update $SUBSCRIPTION_ID --cancel-at-period-end=false
stripe subscriptions cancel $SUBSCRIPTION_ID
```

### Step 10.2: Alternatively, update via webhook simulation

```bash
# This simulates what happens when Stripe marks subscription as canceled/unpaid
stripe trigger customer.subscription.updated
```

### Step 10.3: Verify user downgraded to Free tier

```bash
psql $DATABASE_URL -c "SELECT u.email, p.name, p.is_free_tier FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

Expected:
- name = 'Free'
- is_free_tier = true

### Step 10.4: Verify billing canceled

```bash
psql $DATABASE_URL -c "SELECT status FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected: status = 'canceled'

---

## 🎭 Test 11: Customer Portal

### Step 11.1: Create customer portal session

**Via Frontend:**
- Navigate to billing page
- Click "Manage Subscription"

**Via API:**
```bash
curl -X POST http://localhost:3000/trpc/billing.createCustomerPortalSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "returnUrl": "http://localhost:5173/billing"
  }'
```

Expected: Portal URL returned

### Step 11.2: Verify portal access requires billing record

First, delete billing record:

```bash
psql $DATABASE_URL -c "DELETE FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Now try to create portal session (should fail):

```bash
curl -X POST http://localhost:3000/trpc/billing.createCustomerPortalSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "returnUrl": "http://localhost:5173/billing"
  }'
```

Expected: 404 "User billing not found"

---

## 🧪 Test 12: Edge Cases

### Test 12.1: Webhook Idempotency

```bash
# Get a recent webhook event
stripe events list --limit 1
# Copy the event ID (evt_xxx)

# Resend the same webhook
stripe events resend evt_xxx

# Check database - should not create duplicates
psql $DATABASE_URL -c "SELECT COUNT(*) FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
```

Expected: Still only 1 billing record

### Test 12.2: Invalid Webhook Signature

```bash
curl -X POST http://localhost:3000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid_signature" \
  -d '{"type":"invoice.paid","data":{}}'
```

Expected: 400 Bad Request (signature verification failed)

---

## 📊 Test 13: Database Consistency Checks

### Check 13.1: User productId matches Billing productId

```bash
psql $DATABASE_URL -c "SELECT u.email, u.product_id as user_product, b.product_id as billing_product FROM users u JOIN billings b ON u.id = b.user_id WHERE u.product_id != b.product_id;"
```

Expected: 0 rows (no mismatches)

### Check 13.2: All active subscriptions have future expiry

```bash
psql $DATABASE_URL -c "SELECT u.email, b.status, b.expires_at FROM billings b JOIN users u ON b.user_id = u.id WHERE b.status = 'active' AND b.expires_at < NOW();"
```

Expected: 0 rows (all active subs have future expiry)

### Check 13.3: Canceled subscriptions have past expiry

```bash
psql $DATABASE_URL -c "SELECT u.email, b.status, b.expires_at FROM billings b JOIN users u ON b.user_id = u.id WHERE b.status = 'canceled' AND b.expires_at > NOW();"
```

Expected: 0 rows (all canceled subs have past expiry)

### Check 13.4: No orphaned billing records

```bash
psql $DATABASE_URL -c "SELECT b.id, b.user_id FROM billings b LEFT JOIN users u ON b.user_id = u.id WHERE u.id IS NULL;"
```

Expected: 0 rows (all billings have valid users)

---

## 🧹 Cleanup After All Tests

### Step 1: Cancel all test subscriptions

```bash
# Get all subscription IDs
for sub in $(psql $DATABASE_URL -t -c "SELECT external_subscription_id FROM billings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%@example.com');"); do
  echo "Canceling subscription: $sub"
  stripe subscriptions cancel $sub
done
```

### Step 2: Delete test data from database

```bash
psql $DATABASE_URL -c "DELETE FROM billings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%@example.com'); DELETE FROM users WHERE email LIKE 'test%@example.com';"
```

### Step 3: Verify cleanup

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE email LIKE 'test%@example.com';"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM billings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%@example.com');"
```

Expected: Both counts = 0

### Step 4: Verify Stripe test customers (optional cleanup)

```bash
# List test customers
stripe customers list --email test@example.com

# Delete if needed (optional - test data is isolated)
# stripe customers delete <cus_xxx>
```

---

## ✅ Final Verification Checklist

After running all tests, verify:

- [ ] User can register and starts on Free tier
- [ ] User can purchase monthly subscription
- [ ] User can purchase yearly subscription
- [ ] Monthly subscription expires ~30 days out
- [ ] Yearly subscription expires ~365 days out
- [ ] User can switch monthly → yearly
- [ ] User can switch yearly → monthly
- [ ] User can upgrade tiers (Pro → Enterprise)
- [ ] Payment failure sets status to past_due
- [ ] Payment retry success restores active status
- [ ] Subscription cancellation downgrades to Free tier
- [ ] Resubscription reuses existing Stripe customer
- [ ] Customer portal works for active subscriptions
- [ ] Webhooks process idempotently (no duplicates)
- [ ] Database consistency maintained throughout

---

## 🐛 Troubleshooting Commands

### Backend not responding

```bash
curl http://localhost:3000/health
# If fails, restart: cd back-end && npm run dev
```

### Webhooks not received

```bash
# Check Stripe CLI is running
ps aux | grep stripe

# Restart if needed
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### Database connection issues

```bash
psql $DATABASE_URL -c "SELECT 1;"
# If fails, check DATABASE_URL is correct
echo $DATABASE_URL
```

### View backend logs

```bash
# In backend directory
tail -f logs/app.log  # Or wherever logs are
# Or just watch the terminal where npm run dev is running
```

### View recent Stripe events

```bash
stripe events list --limit 20
```

### Check Stripe subscription status

```bash
stripe subscriptions retrieve <sub_xxx> | grep status
```

---

## 📝 Notes

- Always use test card `4242 4242 4242 4242` for successful payments
- Expiry date doesn't matter (use any future date like 12/30)
- CVC can be any 3 digits (e.g., 123)
- ZIP can be any valid format (e.g., 12345)
- Keep Stripe CLI webhook forwarding running at all times
- Check Terminal 2 for webhook events after each action
- Save subscription IDs and customer IDs for multi-step tests
- Clean up test data after each testing session

---

**Testing Duration**: ~30-45 minutes for complete test suite

**Quick Smoke Test**: Tests 1, 2, 4, 5 (~10 minutes)

**Critical Path**: Tests 1, 2, 5, 10 (~15 minutes)
