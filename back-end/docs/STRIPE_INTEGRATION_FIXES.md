# Stripe Integration Critical Fixes

## Overview

This document describes the critical fixes implemented to resolve issues in the Stripe subscription billing integration.

## Issues Fixed

### 1. Payment Failure Handling ✅

**Problem:** When payment fails (`invoice.payment_failed` webhook), the code only updated status to `past_due`. The original issue was concern about whether users should keep access during Stripe's retry period.

**Solution:** Keep it simple - just update status to `past_due`, don't touch `expiresAt`.

**Rationale:**
- User paid for access until their `expiresAt` date, they should get it
- Stripe automatically retries failed payments for up to 2 weeks
- Natural expiration handles access revocation
- The `past_due` status allows UI to show payment warnings
- Simpler code with no complex grace period logic

**Files Changed:**
- `src/services/billing.service.ts` - `updateBillingOnPaymentFailed()`

**How it works:**
```typescript
await updateBillingById({
    id: billing.id,
    updates: { status: 'past_due' }
})
// That's it! expiresAt stays as-is, natural expiration handles the rest
```

---

### 2. Product ID Updates on Plan Changes ✅

**Problem:** When users changed subscription plans (yearly ↔ monthly), the `customer.subscription.updated` webhook updated `expiresAt` correctly but **didn't update `productId`** in either the `billing` table or `user` table. This meant:
- User's subscription reflects old product type
- Feature gating based on product breaks
- UI shows incorrect plan information

**Solution:**
- Extract price ID from subscription webhook
- Look up corresponding product in database
- Update both `billing.productId` and `user.productId`

**Files Changed:**
- `src/controllers/billing.controller.ts` - `customer.subscription.updated` handler
- `src/services/billing.service.ts` - `updateBillingOnSubscriptionUpdated()`

**How it works:**
```typescript
// In controller - extract product from webhook
const priceId = updatedSubscription.items.data[0]?.price?.id
let productId: string | undefined

if (priceId) {
    const product = await getProductByExternalPriceId({ priceId })
    if (product) {
        productId = product.id
    }
}

// In service - update both billing and user
await updateBillingById({
    id: billing.id,
    updates: {
        productId: input.productId,
        status: input.status,
        expiresAt: input.currentPeriodEnd
    }
})

if (input.productId && input.productId !== billing.productId) {
    await updateUserById({
        id: billing.userId,
        updates: { productId: input.productId }
    })
}
```

---

### 3. Downgrade to Free Tier on Payment Retry Failure ✅

**Problem:** When Stripe exhausts all payment retry attempts, the subscription status changes to `canceled` or `unpaid`. The code didn't downgrade the user to the free tier, leaving them on a paid plan indefinitely.

**Solution:** Detect `canceled` or `unpaid` status in `customer.subscription.updated` webhook and automatically downgrade user to free tier.

**Files Changed:**
- `src/services/billing.service.ts` - `updateBillingOnSubscriptionUpdated()`

**How it works:**
```typescript
// Handle subscription canceled/unpaid after retry failures
if (input.status === 'canceled' || input.status === 'unpaid') {
    console.log('[SERVICE] Subscription became canceled/unpaid, downgrading to free tier')
    const defaultProduct = await getFreeTierProduct()
    await updateUserById({
        id: billing.userId,
        updates: { productId: defaultProduct.id }
    })
}
```

---

## Testing the Fixes

### Before Deploying

1. **Build and verify:**
   ```bash
   npm run build
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

### After Deploying

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

#### Test Scenario 1: Payment Failure
```bash
# Trigger payment failure
stripe trigger invoice.payment_failed

# Verify:
# - Status changed to 'past_due'
# - expiresAt extended by grace period if already expired
```

#### Test Scenario 2: Plan Change (Yearly → Monthly)
```bash
# Update subscription in Stripe Dashboard or via API
# Change from yearly price to monthly price

# Verify customer.subscription.updated webhook:
# - productId updated in billing table
# - productId updated in user table
# - expiresAt reflects new period (~1 month)
```

#### Test Scenario 3: Subscription Cancellation after Retries
```bash
# Let payment retries exhaust (or manually update in Dashboard)
# Set subscription status to 'canceled'

# Verify:
# - User downgraded to free tier product
# - billing.status = 'canceled'
```

---

## Webhook Flow Summary

### invoice.paid
1. ✅ Extract subscription ID, price ID, period end
2. ✅ Look up product by price ID
3. ✅ Update/create billing record with correct productId and expiresAt
4. ✅ Update user.productId

### invoice.payment_failed
1. ✅ Get billing by subscription ID
2. ✅ Update status to 'past_due'
3. ✅ Keep expiresAt unchanged (natural expiration)

### customer.subscription.updated
1. ✅ Extract price ID from subscription items
2. ✅ Look up product if price ID present
3. ✅ Update billing with productId, status, expiresAt
4. ✅ Update user.productId if product changed
5. ✅ Downgrade to free tier if status is canceled/unpaid

### customer.subscription.deleted
1. ✅ Update billing status to 'canceled'
2. ✅ Set expiresAt to now (already expired)
3. ✅ Downgrade user to free tier

## Monitoring Recommendations

Add monitoring for:

1. **Webhook processing failures** - Track exceptions in webhook handler
2. **Past due subscriptions** - How many users are in past_due status
3. **Failed retry conversions** - Track canceled/unpaid subscriptions
4. **Product change frequency** - Monitor plan upgrades/downgrades

## Note on Webhook Idempotency

This implementation does NOT include explicit webhook idempotency checking (tracking processed event IDs in a database). This is intentional because:

1. **Webhook handlers are naturally idempotent** - All operations use `updateBillingById` which overwrites data, not `insert` operations
2. **Stripe duplicate events are rare** - Duplicates mainly occur during network issues or slow responses
3. **Simpler is better** - No extra database table, migrations, or queries on every webhook
4. **If needed later** - Can add in-memory Set or Redis cache if duplicate processing becomes an issue

If you experience duplicate webhook issues in production, consider adding a simple in-memory cache rather than a full database solution.

---

## Related Documentation

- [Stripe Webhooks Best Practices](https://docs.stripe.com/webhooks/best-practices)
- [Stripe Smart Retries](https://docs.stripe.com/billing/revenue-recovery/smart-retries)
- [Subscription Lifecycle](https://docs.stripe.com/billing/subscriptions/overview)
