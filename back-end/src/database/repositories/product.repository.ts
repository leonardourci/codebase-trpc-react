import knex from '../knex'
import Product, { IProduct } from '../models/Product.model'

export const getProductById = async ({ id }: { id: string }): Promise<IProduct | null> => {
    const [row] = await knex(Product.tableName)
        .where({ id })
        .select()

    if (!row) {
        return null
    }

    return new Product({
        id: row.id,
        name: row.name,
        currency: row.currency,
        description: row.description,
        priceInCents: row.price_in_cents,
        type: row.type,
        externalProductId: row.external_product_id,
        externalPriceId: row.external_price_id || '',
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }).toJSON()
}

export const getProductByExternalProductId = async ({ id }: { id: string }): Promise<IProduct | null> => {
    const [row] = await knex(Product.tableName)
        .where({ external_product_id: id })
        .select()

    if (!row) {
        return null
    }

    return new Product({
        id: row.id,
        name: row.name,
        currency: row.currency,
        description: row.description,
        priceInCents: row.price_in_cents,
        type: row.type,
        externalProductId: row.external_product_id,
        externalPriceId: row.external_price_id || '',
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }).toJSON()
}

export const getAllProducts = async (): Promise<IProduct[]> => {
    const rows = await knex(Product.tableName)
        .where({ active: true })
        .select()

    return rows.map(row => new Product({
        id: row.id,
        name: row.name,
        currency: row.currency,
        description: row.description,
        priceInCents: row.price_in_cents,
        type: row.type,
        externalProductId: row.external_product_id,
        externalPriceId: row.external_price_id || '',
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }).toJSON())
}
