# Product API

## Overview
Product management endpoints for retrieving product information and listings.

---

## `product.getById`

**Summary:** Get product details by ID  
**Use case:** Fetch specific product information for display or purchase

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique product identifier |

### Input Example
```json
{
  "id": "prod_123"
}
```

### Output Example
```json
{
  "id": "prod_123",
  "name": "Premium Plan",
  "description": "Full access to all features",
  "price": 29.99,
  "currency": "USD",
  "externalPriceId": "price_1234567890",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## `product.getAll`

**Summary:** Get all available products  
**Use case:** Display product catalog or pricing page

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| - | - | - | No parameters required |

### Input Example
```json
{}
```

### Output Example
```json
[
  {
    "id": "prod_123",
    "name": "Basic Plan",
    "description": "Essential features for getting started",
    "price": 9.99,
    "currency": "USD",
    "externalPriceId": "price_1111111111",
    "features": ["Feature 1", "Feature 2"]
  },
  {
    "id": "prod_456",
    "name": "Premium Plan",
    "description": "Full access to all features",
    "price": 29.99,
    "currency": "USD",
    "externalPriceId": "price_2222222222",
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
  }
]
```

---

## Usage Notes

- All endpoints are public (no authentication required)
- Product IDs are unique identifiers in the system
- `externalPriceId` corresponds to Stripe price IDs
- Products include pricing and feature information
- Returns `null` if product not found by ID