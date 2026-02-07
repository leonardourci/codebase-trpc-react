import knex from '../knex'
import { IProduct, IProductDbRow } from '../../types/product'
import { keysToCamelCase } from '../../utils/case-conversion'

export const PRODUCTS_TABLE = 'products'

export const getProductById = async ({ id }: { id: string }): Promise<IProduct | null> => {
	const [row] = await knex(PRODUCTS_TABLE).where({ id }).select()

	if (!row) {
		return null
	}

	return keysToCamelCase<IProductDbRow, IProduct>(row)
}

export const getProductByExternalPriceId = async ({ priceId }: { priceId: string }): Promise<IProduct | null> => {
	const [row] = await knex(PRODUCTS_TABLE).where({ external_price_id: priceId }).select()

	if (!row) {
		return null
	}

	return keysToCamelCase<IProductDbRow, IProduct>(row)
}

export const getAllProducts = async (): Promise<IProduct[]> => {
	const rows = await knex(PRODUCTS_TABLE).where({ active: true }).select()

	return rows.map((row) => keysToCamelCase<IProductDbRow, IProduct>(row))
}

/**
 * Retrieves the free tier product.
 * NOTE: This should always return a product. If it throws an error,
 * you need to update your database seed to mark one product with is_free_tier = true.
 */
export const getFreeTierProduct = async (): Promise<IProduct> => {
	const [row] = await knex(PRODUCTS_TABLE).where({ is_free_tier: true }).select().limit(1)

	if (!row) {
		throw new Error('Free tier product not found. Update your database seed to mark one product with is_free_tier = true.')
	}

	return keysToCamelCase<IProductDbRow, IProduct>(row)
}
