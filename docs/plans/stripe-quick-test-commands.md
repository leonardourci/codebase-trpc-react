# Stripe Testing - Quick Command Reference

**Purpose**: Copy-paste commands for rapid testing. Use alongside the full testing plan.

---

## ⚡ Setup Commands (Run Once)

```bash
# Terminal 1: Start webhook forwarding
stripe listen --forward-to localhost:3000/webhooks/stripe

# Terminal 2: Backend logs
cd back-end && npm run dev

# Terminal 3: Database connection
export DATABASE_URL="your_postgres_connection_string"
psql $DATABASE_URL
```

---

## 🚀 Quick Test Scenarios

### 1. Register Test User
```bash
# Register user
curl -X POST http://localhost:3000/trpc/auth.register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User","phone":"1234567890","age":25}'

# Verify free tier
psql $DATABASE_URL -c "SELECT u.email, p.name FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"

# Cleanup
psql $DATABASE_URL -c "DELETE FROM users WHERE email='test@example.com';"
```

---

### 2. Complete Monthly Subscription Purchase
```bash
# Step 1: Create checkout session (via frontend or get JWT token for API call)
# Use test card: 4242 4242 4242 4242

# Step 2: After completion, verify webhook received
# Check Stripe CLI output for: invoice.paid

# Step 3: Verify database
psql $DATABASE_URL -c "SELECT u.email, p.name, p.price_in_cents, b.status, b.expires_at FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"

# Step 4: Get subscription ID
psql $DATABASE_URL -c "SELECT external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"

# Cleanup
# Replace <sub_xxx> with actual subscription ID
stripe subscriptions cancel <sub_xxx>
psql $DATABASE_URL -c "DELETE FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com'); UPDATE users SET product_id = (SELECT id FROM products WHERE is_free_tier = true) WHERE email='test@example.com';"
```

---

### 3. Complete Yearly Subscription Purchase
```bash
# Step 1: Create checkout with yearly price ID (via frontend)
# Use test card: 4242 4242 4242 4242

# Step 2: Verify yearly subscription
psql $DATABASE_URL -c "SELECT u.email, p.name, p.price_in_cents, DATE_PART('day', b.expires_at - NOW()) as days_until_expiry FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"
# Should show price_in_cents = 49990 or 99990, days_until_expiry ≈ 365

# Cleanup
stripe subscriptions cancel <sub_xxx>
```

---

### 4. Test Payment Failure
```bash
# Trigger payment failure
stripe trigger invoice.payment_failed

# Verify status updated to past_due
psql $DATABASE_URL -c "SELECT status, expires_at FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
# Expected: status='past_due'

# Simulate successful retry
stripe trigger invoice.paid

# Verify back to active
psql $DATABASE_URL -c "SELECT status FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
# Expected: status='active'
```

---

### 5. Test Subscription Cancellation
```bash
# Get subscription ID
psql $DATABASE_URL -c "SELECT external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');" -t

# Cancel at period end
stripe subscriptions update <sub_xxx> --cancel-at-period-end=true

# Verify still active but scheduled cancellation
stripe subscriptions retrieve <sub_xxx> | grep cancel_at_period_end
# Should show: true

# Verify database still active
psql $DATABASE_URL -c "SELECT status, expires_at FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"

# Cancel immediately (for cleanup)
stripe subscriptions cancel <sub_xxx>

# Verify user downgraded to free
psql $DATABASE_URL -c "SELECT u.email, p.name, p.is_free_tier FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='test@example.com';"
```

---

### 6. Test Plan Upgrade (Monthly → Yearly)
```bash
# Pre-req: User has active monthly subscription

# Get subscription and item IDs
stripe subscriptions retrieve <sub_xxx>
# Note the subscription_item_id from items.data[0].id

# Update to yearly price
stripe subscriptions update <sub_xxx> --items[0][id]=<si_xxx> --items[0][price]=<price_YOUR_YEARLY_ID>

# Verify database updated
psql $DATABASE_URL -c "SELECT p.name, p.price_in_cents, p.external_price_id, DATE_PART('day', b.expires_at - NOW()) as days FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"
# Should show yearly price (49990 or 99990) and ~365 days
```

---

### 7. Test Resubscription (After Cancellation)
```bash
# Pre-req: User previously had subscription, now on free tier

# Check user has existing customer ID
psql $DATABASE_URL -c "SELECT external_customer_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
# Note the cus_xxx ID

# Create new checkout session (via frontend)
# Checkout should use existing customer ID (verify in Stripe Dashboard)

# After completing checkout, verify same customer ID reused
psql $DATABASE_URL -c "SELECT external_customer_id, external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');"
# Customer ID should match, subscription ID should be NEW

# Verify in Stripe (should only have 1 customer)
stripe customers list --email test@example.com
# Should return exactly 1 customer

# Count subscriptions under this customer
stripe subscriptions list --customer <cus_xxx>
# Should show current subscription (past ones will be there but canceled)
```

---

## 🔍 Quick Diagnostics

### Check Current User State
```bash
psql $DATABASE_URL -c "SELECT u.email, p.name as product, p.price_in_cents, p.is_free_tier, b.status as billing_status, b.expires_at, b.external_subscription_id, b.external_customer_id FROM users u LEFT JOIN products p ON u.product_id = p.id LEFT JOIN billings b ON b.user_id = u.id WHERE u.email='test@example.com';"
```

### Check All Active Subscriptions
```bash
psql $DATABASE_URL -c "SELECT u.email, p.name, p.price_in_cents, b.status, b.expires_at FROM billings b JOIN users u ON b.user_id = u.id JOIN products p ON b.product_id = p.id WHERE b.status = 'active';"
```

### Check Subscription Type Distribution
```bash
psql $DATABASE_URL -c "SELECT CASE WHEN p.price_in_cents = 0 THEN 'Free' WHEN p.price_in_cents IN (4999, 9999) THEN 'Monthly' WHEN p.price_in_cents IN (49990, 99990) THEN 'Yearly' END as type, COUNT(*) FROM billings b JOIN products p ON b.product_id = p.id WHERE b.status = 'active' GROUP BY type;"
```

### Verify Products Seeded
```bash
psql $DATABASE_URL -c "SELECT name, price_in_cents, external_price_id, is_free_tier FROM products ORDER BY price_in_cents;"
# Should show 5 rows: Free (0), Pro Monthly (4999), Pro Yearly (49990), Enterprise Monthly (9999), Enterprise Yearly (99990)
```

### Check Recent Stripe Events
```bash
stripe events list --limit 10
```

### Get Latest Invoice for Customer
```bash
stripe invoices list --customer <cus_xxx> --limit 1
```

---

## 🧪 Test Cards

| Scenario | Card Number | Use Case |
|----------|-------------|----------|
| **Success** | `4242 4242 4242 4242` | Normal purchase |
| **Decline** | `4000 0000 0000 0002` | Generic decline |
| **Insufficient Funds** | `4000 0000 0000 9995` | Payment failure testing |
| **3D Secure** | `4000 0025 0000 3155` | Auth required |

**Always use:**
- Expiry: Any future date (e.g., 12/30)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any ZIP code

---

## 🧹 Cleanup Commands

### Clean Single Test User
```bash
# Get subscription ID first
SUB_ID=$(psql $DATABASE_URL -t -c "SELECT external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com');")

# Cancel subscription in Stripe
stripe subscriptions cancel $SUB_ID

# Delete from database
psql $DATABASE_URL -c "DELETE FROM billings WHERE user_id = (SELECT id FROM users WHERE email='test@example.com'); DELETE FROM users WHERE email='test@example.com';"
```

### Clean All Test Users
```bash
# List all test users
psql $DATABASE_URL -c "SELECT email FROM users WHERE email LIKE 'test%@example.com';"

# Cancel all their subscriptions
for sub in $(psql $DATABASE_URL -t -c "SELECT b.external_subscription_id FROM billings b JOIN users u ON b.user_id = u.id WHERE u.email LIKE 'test%@example.com';"); do
  stripe subscriptions cancel $sub
done

# Delete from database
psql $DATABASE_URL -c "DELETE FROM billings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%@example.com'); DELETE FROM users WHERE email LIKE 'test%@example.com';"
```

### Reset Everything (Nuclear Option)
```bash
# WARNING: This deletes ALL billing data and test users

# Cancel all subscriptions in Stripe
for sub in $(stripe subscriptions list --limit 100 | grep "sub_" | awk '{print $2}'); do
  stripe subscriptions cancel $sub
done

# Clear database
psql $DATABASE_URL -c "TRUNCATE billings CASCADE; DELETE FROM users WHERE email LIKE 'test%@example.com';"

# Re-seed products
cd back-end && npm run db:seed
```

---

## 🐛 Troubleshooting One-Liners

### Check if Webhook Secret is Correct
```bash
echo $STRIPE_WEBHOOK_SECRET
# Compare with Stripe CLI output
```

### Manually Trigger Webhook
```bash
# Find event ID from Stripe Dashboard or CLI
stripe events resend <evt_xxx>
```

### Check Backend Webhook Logs
```bash
# In backend directory
npm run dev 2>&1 | grep WEBHOOK
```

### Verify Stripe CLI Forwarding
```bash
# Should see "Ready! Your webhook signing secret is ..."
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### Check Database Connection
```bash
psql $DATABASE_URL -c "SELECT NOW();"
# Should return current timestamp
```

---

## 📊 Performance Testing

### Test Concurrent Checkouts
```bash
# Create 3 users and checkout simultaneously
for i in {1..3}; do
  (curl -X POST http://localhost:3000/trpc/auth.register -H "Content-Type: application/json" -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123!\",\"fullName\":\"Test User $i\",\"phone\":\"1234567890\",\"age\":25}" &)
done

# Wait for registration
sleep 2

# Complete checkouts via frontend for all 3 users
# Then verify all processed correctly
psql $DATABASE_URL -c "SELECT u.email, p.name, b.status FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email LIKE 'test%@example.com' ORDER BY u.email;"
```

---

## 🎯 Critical Path Testing (5 min)

```bash
# 1. Setup
export DATABASE_URL="your_connection_string"
cd back-end && npm run dev & 
stripe listen --forward-to localhost:3000/webhooks/stripe &

# 2. Register user
curl -X POST http://localhost:3000/trpc/auth.register -H "Content-Type: application/json" -d '{"email":"quicktest@example.com","password":"Test123!","fullName":"Quick Test","phone":"1234567890","age":25}'

# 3. Verify free tier
psql $DATABASE_URL -c "SELECT u.email, p.name FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='quicktest@example.com';"

# 4. Complete Pro Monthly checkout via frontend (use 4242 4242 4242 4242)

# 5. Verify subscription active
psql $DATABASE_URL -c "SELECT u.email, p.name, b.status FROM users u JOIN products p ON u.product_id = p.id JOIN billings b ON b.user_id = u.id WHERE u.email='quicktest@example.com';"

# 6. Cancel subscription
SUB_ID=$(psql $DATABASE_URL -t -c "SELECT external_subscription_id FROM billings WHERE user_id = (SELECT id FROM users WHERE email='quicktest@example.com');")
stripe subscriptions cancel $SUB_ID

# 7. Verify downgraded
psql $DATABASE_URL -c "SELECT u.email, p.name, p.is_free_tier FROM users u JOIN products p ON u.product_id = p.id WHERE u.email='quicktest@example.com';"

# 8. Cleanup
psql $DATABASE_URL -c "DELETE FROM billings WHERE user_id = (SELECT id FROM users WHERE email='quicktest@example.com'); DELETE FROM users WHERE email='quicktest@example.com';"

# ✅ If all steps pass, core functionality works!
```

---

**Pro Tip**: Keep this file open in a split terminal for instant copy-paste during testing sessions.
