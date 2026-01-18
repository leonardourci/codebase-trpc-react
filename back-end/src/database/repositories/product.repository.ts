import knex from '../knex'
import Product, { IProduct } from '../models/Product.model'

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
        price: row.price,
        type: row.type,
        externalProductId: row.external_product_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }).toJSON()
}