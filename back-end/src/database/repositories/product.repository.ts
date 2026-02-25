import knex from '../knex'
import { Product, ProductDbRow } from '../../types/product'
import { keysToCamelCase } from '../../utils/case-conversion'

export const PRODUCTS_TABLE = 'products'

export const getProductById = async ({ id }: { id: string }): Promise<Product | null> => {
	const [row] = await knex(PRODUCTS_TABLE).where({ id }).select()

	if (!row) {
		return null
	}

	return keysToCamelCase<ProductDbRow, Product>(row)
}

export const getProductByExternalPriceId = async ({ id }: { id: string }): Promise<Product | null> => {
	const [row] = await knex(PRODUCTS_TABLE).where({ external_price_id: id }).select()

	if (!row) {
		return null
	}

	return keysToCamelCase<ProductDbRow, Product>(row)
}

export const getAllProducts = async (): Promise<Product[]> => {
	const rows = await knex(PRODUCTS_TABLE).where({ active: true }).select()

	return rows.map((row) => keysToCamelCase<ProductDbRow, Product>(row))
}

/**
 * Retrieves the free tier product.
 * NOTE: This should always return a product. If it throws an error,
 * you need to update your database seed to mark one product with is_free_tier = true.
 */
export const getFreeTierProduct = async (): Promise<Product> => {
	const [row] = await knex(PRODUCTS_TABLE).where({ is_free_tier: true }).select().limit(1)

	if (!row) {
		throw new Error('Free tier product not found. Update your database seed to mark one product with is_free_tier = true.')
	}

	return keysToCamelCase<ProductDbRow, Product>(row)
}
