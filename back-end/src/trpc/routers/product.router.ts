import { router, procedure } from '..'
import { getProductByIdSchema } from '../../utils/validations/product.schemas'
import { getProductById, getAllProducts } from '../../database/repositories/product.repository'

export const productRouter = router({
	getById: procedure.input(getProductByIdSchema).query(async ({ input }) => {
		return await getProductById({ id: input.id })
	}),

	getAll: procedure.query(async () => {
		return await getAllProducts()
	})
})
