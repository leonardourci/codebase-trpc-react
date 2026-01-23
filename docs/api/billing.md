# Billing API

## Overview
Billing and subscription management endpoints using Stripe integration for checkout sessions and customer portal access.

---

## `billing.createCheckoutSession`

**Summary:** Create a Stripe checkout session for product subscription  
**Use case:** Initiate payment flow for a product subscription

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | string | Yes | ID of the product to purchase |
| successUrl | string (URL) | Yes | Redirect URL after successful payment |
| cancelUrl | string (URL) | Yes | Redirect URL if payment is cancelled |
| token | string | Yes | Authentication token |

**Note:** Requires authentication (Bearer token in Authorization header)

### Input Example
```json
{
  "productId": "prod_123",
  "successUrl": "https://myapp.com/success",
  "cancelUrl": "https://myapp.com/cancel",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Output Example
```json
{
  "id": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890#fidkdWxOYHwnPyd1blpxYHZxWjA0S..."
}
```

---

## `billing.createCustomerPortalSession`

**Summary:** Create Stripe customer portal session for subscription management  
**Use case:** Allow customers to manage their subscriptions, billing info, and payment methods

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| returnUrl | string (URL) | Yes | URL to redirect back to after portal session |
| token | string | Yes | Authentication token |

**Note:** Requires authentication and existing Stripe customer record

### Input Example
```json
{
  "returnUrl": "https://myapp.com/dashboard",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Output Example
```json
{
  "url": "https://billing.stripe.com/session/bps_1234567890"
}
```

---

## Usage Notes

- All endpoints require authentication
- User must have existing billing record for customer portal
- Checkout sessions are for subscription mode only
- URLs must be valid and accessible
- Promotion codes are enabled for checkout sessions
- Portal sessions allow full subscription management