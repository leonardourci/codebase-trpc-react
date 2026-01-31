# Stripe Integration — Local Testing Guide

## Prerequisites

- [Stripe CLI](https://stripe.com/docs/stripe-cli) installed
- A Stripe account with **test mode** enabled
- Products and prices created in your Stripe Dashboard

---

## 1. Install & Authenticate the Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Authenticate (opens browser)
stripe login
```

This pairs the CLI with your Stripe account. It uses **test mode** by default.

---

## 2. Create Products in Stripe Dashboard

Go to **Product catalog** in the Stripe Dashboard (make sure you're in test mode — toggle in the top right).

Create your plans (e.g. Basic, Pro, Enterprise) with **recurring** prices. After creating them, note down:

- **Product ID** — looks like `prod_xxx`
- **Price ID** — looks like `price_xxx`

You'll need these in the next step.

---

## 3. Seed Your Local Database

Your backend looks up products by `external_product_id` and `external_price_id` in the `products` table. Insert rows that match what you created in Stripe:                     

```sql
INSERT INTO products (name, description, price_in_cents, currency, type, external_product_id, external_price_id, active)
VALUES
  ('Basic', 'Perfect for getting started', 999, 'USD', 'subscription', 'prod_YOUR_BASIC_ID', 'price_YOUR_BASIC_ID', true),
  ('Pro', 'Everything you need to grow', 2999, 'USD', 'subscription', 'prod_YOUR_PRO_ID', 'price_YOUR_PRO_ID', true),
  ('Enterprise', 'For large teams', 9999, 'USD', 'subscription', 'prod_YOUR_ENTERPRISE_ID', 'price_YOUR_ENTERPRISE_ID', true);
```

Replace the `prod_` and `price_` values with yours from the dashboard.

---

## 4. Configure Environment Variables

In your `.env.backend`, set:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_will_fill_this_next
```

- `STRIPE_SECRET_KEY` — found in the Stripe Dashboard under **Developers > API keys**
- `STRIPE_WEBHOOK_SECRET` — you get this from the CLI in the next step

---

## 5. Start the Webhook Listener

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

The CLI will print:

```
> Ready! Your webhook signing secret is whsec_abc123xyz...
```

**Copy that `whsec_...` value** into your `.env.backend` as `STRIPE_WEBHOOK_SECRET`, then restart your backend.

### What's happening here?

The Stripe CLI opens a persistent WebSocket connection to Stripe's servers. When an event fires (e.g. a payment succeeds), Stripe pushes it over the WebSocket to the CLI, which then forwards it as an HTTP POST to your local server. This is how you receive webhooks without exposing your machine to the internet.

---

## 6. Start All Services

You need three terminals running:

```bash
# Terminal 1 — Backend
cd back-end && npm run dev

# Terminal 2 — Frontend
cd front-end && npm run dev

# Terminal 3 — Stripe CLI (from step 5)
stripe listen --forward-to localhost:3000/webhooks/stripe
```

---

## 7. Test: Successful Subscription Checkout

1. Open `http://localhost:5173/billing`
2. Log in with an account that has a **verified email**
3. Click **Subscribe** on a plan
4. You'll be redirected to Stripe Checkout (test mode)
5. Use the test card:

| Field       | Value                    |
|-------------|--------------------------|
| Card number | `4242 4242 4242 4242`    |
| Expiry      | Any future date (e.g. `12/34`) |
| CVC         | Any 3 digits             |
| ZIP         | Any 5 digits             |

6. Click **Subscribe**

### What to observe

- **Terminal 3 (Stripe CLI):** You'll see events being forwarded:
  ```
  --> invoice.paid [evt_xxx]  200 OK
  --> customer.subscription.created [evt_xxx]
  ```
- **Terminal 1 (Backend):** Console logs showing the webhook data (email, product, customer ID, etc.)
- **Database:** A new row in the `billings` table with `status = 'active'`
- **Browser:** After redirecting back, refresh `/billing` — you should see your active subscription card

---

## 8. Test: Payment Failure

Stripe provides special test card numbers that simulate failures.

Use `4000 0000 0000 0341` — this card attaches successfully but **fails on the first charge attempt**.

After the payment fails:
- The CLI should forward an `invoice.payment_failed` event
- Your `billings` row status should update to `past_due`

### Other useful failure cards

| Card Number            | Behavior                          |
|------------------------|-----------------------------------|
| `4000 0000 0000 9995`  | Decline (insufficient funds)      |
| `4000 0000 0000 0002`  | Decline (generic)                 |
| `4000 0000 0000 0069`  | Decline (expired card)            |

Full list: https://docs.stripe.com/testing#cards

---

## 9. Test: Subscription Cancellation

1. On the billing page, click **Manage in Stripe Portal**
2. In the Stripe Customer Portal, click **Cancel plan**
3. Confirm the cancellation

### What to observe

Two webhook events will fire:

1. **`customer.subscription.updated`** — `cancel_at_period_end` becomes `true`. Your DB should update `expires_at` to the end of the current billing period.
2. **`customer.subscription.deleted`** — Fires when the subscription actually ends. Your DB status should update to `canceled`.

> **Note:** In test mode, you can use the Stripe Dashboard to immediately cancel (instead of waiting for period end) to see both events quickly.

---

## 10. Test: Manual Event Triggers

The Stripe CLI can fire synthetic events directly, which is useful for testing that your webhook endpoint is reachable and responds correctly:

```bash
# Simulate a successful invoice payment
stripe trigger invoice.paid

# Simulate a payment failure
stripe trigger invoice.payment_failed

# Simulate a subscription deletion
stripe trigger customer.subscription.deleted

# Simulate a subscription update
stripe trigger customer.subscription.updated
```

**Important caveat:** These synthetic events contain fake IDs (e.g. `cus_000000000000`, `sub_000000000000`). Your database lookups for the matching user/product will fail, so you'll see errors in your backend logs. That's expected.

These triggers are useful to verify:
- The webhook endpoint responds with `200`
- Signature verification passes
- The event routing logic enters the correct `switch` case

For full end-to-end testing, use the actual checkout flow (steps 7-9).

---

## 11. Verification Checklist

Use this checklist when going through all tests:

- [ ] `stripe listen` is running and shows the `whsec_` secret
- [ ] `STRIPE_WEBHOOK_SECRET` in `.env.backend` matches the CLI output
- [ ] Products table has rows with correct `external_product_id` and `external_price_id`
- [ ] Checkout redirects to `checkout.stripe.com` with the correct product
- [ ] User's email is pre-filled on the Stripe Checkout page
- [ ] After payment, `invoice.paid` event returns `200` in the CLI output
- [ ] `billings` table has a new row with `status = 'active'`
- [ ] `external_customer_id`, `external_subscription_id`, and `external_payment_intent_id` are populated (not `[object Object]`)
- [ ] Billing page shows the active subscription
- [ ] "Manage in Stripe Portal" redirects correctly
- [ ] After cancellation, `billings.status` updates to `canceled`
- [ ] Payment failure card results in `billings.status = 'past_due'`

---

## 12. Debugging

### Webhook returns 400

The most common cause is a mismatch between the webhook secret and what the CLI provides.

1. Check that `STRIPE_WEBHOOK_SECRET` in `.env.backend` starts with `whsec_`
2. Make sure you **restarted the backend** after changing the env file
3. If you restarted `stripe listen`, it may generate a **new** secret — update your env again

### Product not found errors

Your `products.external_product_id` must match the product ID that Stripe sends inside the `invoice.paid` event's line items. Double-check by adding `--print-json` to the listen command:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe --print-json
```

This prints the full event payload so you can see exactly what product/price IDs Stripe sends.

### No events arriving

- Make sure `stripe listen` is still running (it can disconnect silently)
- Check that your backend is actually running on port `3000`
- Verify the forwarding URL matches your backend's webhook route: `localhost:3000/webhooks/stripe`

### Checkout fails immediately

- Verify the `external_price_id` in your products table matches an active price in Stripe
- Check the backend logs for the Stripe API error message — it usually tells you exactly what's wrong

---

## 13. Stripe Dashboard — Useful Pages in Test Mode

- **Events log:** https://dashboard.stripe.com/test/events — see all events with payloads
- **Customers:** https://dashboard.stripe.com/test/customers — see created customers
- **Subscriptions:** https://dashboard.stripe.com/test/subscriptions — manage active subscriptions
- **Product catalog:** https://dashboard.stripe.com/test/products — your products and prices
- **Webhook endpoints:** https://dashboard.stripe.com/test/webhooks — see delivery attempts and failures (for production webhooks, not CLI)

---

## 14. Moving to Production

When you're ready to go live:

1. Switch `STRIPE_SECRET_KEY` to your live key (`sk_live_...`)
2. Create a **real** webhook endpoint in the Stripe Dashboard pointing to your deployed server's `/webhooks/stripe` URL
3. Set `STRIPE_WEBHOOK_SECRET` to the signing secret from that endpoint (not the CLI one)
4. Subscribe to these events in the dashboard: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Update your `products` table with production product/price IDs
