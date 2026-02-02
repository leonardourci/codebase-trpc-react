# Free Tier Product Identification Design

**Date:** 2026-02-02
**Status:** Approved

## Problem

The current implementation identifies the free tier product by querying `WHERE price_in_cents = 0 AND external_product_id IS NULL`. This approach has several issues:

- **Ambiguity**: Multiple products could match this filter if data is accidentally duplicated
- **Implicit logic**: Not immediately clear from the database schema which product is the free tier
- **No enforcement**: Nothing prevents multiple "free" products from existing

## Goals

1. **Data integrity**: Make it impossible to have multiple free tier products
2. **Query reliability**: Unambiguous, simple query that always returns the correct product
3. **Configuration clarity**: Obvious which product is the free tier when looking at the schema
4. **Simplicity**: Minimal changes, easy to understand and maintain
5. **Template-friendly**: Clear pattern for developers using this codebase template

## Solution

Add an explicit `is_free_tier` boolean column with database-level enforcement ensuring only one product can be marked as the free tier.

### Database Schema Changes

**Products table updates:**

```sql
ALTER TABLE products
ADD COLUMN is_free_tier BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN max_projects INTEGER;

CREATE UNIQUE INDEX idx_products_single_free_tier
ON products (is_free_tier)
WHERE is_free_tier = true;
```

**Column details:**
- `is_free_tier`: Boolean, defaults to false, NOT NULL for clarity
- `max_projects`: Integer, nullable (NULL = unlimited). Example column showing pattern for tracking plan limits
- Unique partial index: Database-level enforcement preventing multiple free tiers

### Repository Query Changes

**Update `getFreeTierProduct()` in `product.repository.ts`:**

```typescript
/**
 * Retrieves the free tier product.
 * NOTE: This should always return a product. If it throws an error,
 * you need to update your database seed to mark one product with is_free_tier = true.
 */
export const getFreeTierProduct = async (): Promise<IProduct> => {
    const [row] = await knex(PRODUCTS_TABLE)
        .where({ is_free_tier: true })
        .select()
        .limit(1)

    if (!row) {
        throw new Error(
            'Free tier product not found. Update your database seed to mark one product with is_free_tier = true.'
        )
    }

    return keysToCamelCase<IProductDbRow, IProduct>(row)
}
```

**Key changes:**
- Simplified query: `where({ is_free_tier: true })` instead of compound filter
- Return type: `Promise<IProduct>` (no longer nullable)
- Fail fast: Throws error if no free tier exists instead of returning null
- Clear error message: Tells developers exactly how to fix misconfiguration

### Type Updates

**Update product interfaces:**

```typescript
export interface IProductDbRow {
  id: string
  name: string
  price_in_cents: number
  external_product_id: string | null
  active: boolean
  is_free_tier: boolean  // NEW
  max_projects: number | null  // NEW
  created_at: Date
  updated_at: Date
}

export interface IProduct {
  id: string
  name: string
  priceInCents: number
  externalProductId: string | null
  active: boolean
  isFreeTier: boolean  // NEW
  maxProjects: number | null  // NEW
  createdAt: Date
  updatedAt: Date
}
```

### Migration Updates

Since this is a template, update the existing products table migration to include the new columns and constraint from the start:

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('name').notNullable()
    table.integer('price_in_cents').notNullable()
    table.string('external_product_id').nullable()
    table.boolean('active').notNullable().defaultTo(true)
    table.boolean('is_free_tier').notNullable().defaultTo(false)
    table.integer('max_projects').nullable()
    table.timestamps(true, true)
  })

  // Create partial unique index for free tier
  await knex.raw(`
    CREATE UNIQUE INDEX idx_products_single_free_tier
    ON products (is_free_tier)
    WHERE is_free_tier = true
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_products_single_free_tier')
  await knex.schema.dropTable('products')
}
```

### Seed Data Updates

Update product seeds to mark the free tier:

```typescript
// Free tier product - exactly one product must have is_free_tier = true
{
  name: 'Free',
  is_free_tier: true,
  max_projects: 5, // Example limit - null means unlimited
  price_in_cents: 0,
  external_product_id: null, // Free tier has no Stripe product
  active: true
}
```

### Impact on Existing Code

**`billing.service.ts` - `updateBillingOnSubscriptionDeleted`:**

Since `getFreeTierProduct()` now throws instead of returning null, simplify from:

```typescript
const defaultProduct = await getFreeTierProduct()
if (defaultProduct) {
  await updateUserById({
    id: billing.userId,
    updates: { currentProductId: defaultProduct.id }
  })
}
```

To:

```typescript
const defaultProduct = await getFreeTierProduct()
await updateUserById({
  id: billing.userId,
  updates: { currentProductId: defaultProduct.id }
})
```

Let it throw if misconfigured - fail fast is better for a template.

## Edge Cases Handled

- ✅ **Multiple free tier products**: Prevented by unique partial index at database level
- ✅ **No free tier product**: Throws clear error with actionable fix instructions
- ✅ **Template extensibility**: `max_projects` column demonstrates pattern for adding plan limits
- ✅ **Backwards compatibility**: Not applicable - this is a template that can update migrations

## Alternative Approaches Considered

1. **Environment variable with product ID**: Adds config complexity, less self-documenting
2. **Query by price_in_cents = 0**: Current approach, ambiguous and not enforced
3. **No free tier product**: Breaks assumption that all users have a product, requires null checks everywhere
4. **Database limits vs code limits**: For a template, showing DB pattern is more flexible

## Implementation Checklist

- [ ] Update products table migration
- [ ] Update product type definitions (IProduct, IProductDbRow)
- [ ] Update `getFreeTierProduct()` function
- [ ] Simplify `updateBillingOnSubscriptionDeleted()` in billing.service.ts
- [ ] Update product seed data
- [ ] Test migration up/down
- [ ] Test free tier product retrieval
- [ ] Test unique constraint enforcement (try creating two free tier products)
