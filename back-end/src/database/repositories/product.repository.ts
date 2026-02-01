import knex from '../knex'
import { IProduct, IProductDbRow } from '../../types/product'
import { keysToCamelCase } from '../../utils/case-conversion'

const PRODUCTS_TABLE = 'products'

export const getProductById = async ({ id }: { id: string }): Promise<IProduct | null> => {
    const [row] = await knex(PRODUCTS_TABLE)
        .where({ id })
        .select()

    if (!row) {
        return null
    }

    return keysToCamelCase<IProductDbRow, IProduct>(row)
}

export const getProductByExternalProductId = async ({ id }: { id: string }): Promise<IProduct | null> => {
    const [row] = await knex(PRODUCTS_TABLE)
        .where({ external_product_id: id })
        .select()

    if (!row) {
        return null
    }

    return keysToCamelCase<IProductDbRow, IProduct>(row)
}

export const getAllProducts = async (): Promise<IProduct[]> => {
    const rows = await knex(PRODUCTS_TABLE)
        .where({ active: true })
        .select()

    return rows.map(row => keysToCamelCase<IProductDbRow, IProduct>(row))
}

export const getFreeTierProduct = async (): Promise<IProduct | null> => {
    const [row] = await knex(PRODUCTS_TABLE)
        .where({ price_in_cents: 0 })
        .whereNull('external_product_id')
        .select()
        .limit(1)

    if (!row) {
        return null
    }

    return keysToCamelCase<IProductDbRow, IProduct>(row)
}
