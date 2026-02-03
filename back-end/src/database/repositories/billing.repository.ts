import knex from '../knex'
import { ICreateBilling, IBilling, IBillingDbRow } from '../../types/billing'
import { IUser } from '../../types/user'
import { keysToCamelCase, keysToSnakeCase } from '../../utils/case-conversion'

const BILLINGS_TABLE = 'billings'

export const createBilling = async (input: ICreateBilling): Promise<IBilling> => {
	const insertData = keysToSnakeCase<ICreateBilling, Partial<IBillingDbRow>>(input)

	const [row] = await knex(BILLINGS_TABLE)
		.insert(insertData)
		.returning('*')

	return keysToCamelCase<IBillingDbRow, IBilling>(row)
}

export const getBillingByUserId = async ({ userId }: { userId: IUser['id'] }): Promise<IBilling | null> => {
	const [row] = await knex(BILLINGS_TABLE).where({ user_id: userId }).select()

	if (!row) return null

	return keysToCamelCase<IBillingDbRow, IBilling>(row)
}

export const updateBillingByUserId = async (input: { id: string; expiresAt: Date }): Promise<IBilling> => {
	const updateData = keysToSnakeCase<Partial<IBilling>, Partial<IBillingDbRow>>({
		expiresAt: input.expiresAt,
		updatedAt: new Date()
	})

	const [row] = await knex(BILLINGS_TABLE)
		.update(updateData)
		.where({ id: input.id })
		.returning('*')

	return keysToCamelCase<IBillingDbRow, IBilling>(row)
}

export const getBillingByExternalSubscriptionId = async ({ externalSubscriptionId }: { externalSubscriptionId: string }): Promise<IBilling | null> => {
	const [row] = await knex(BILLINGS_TABLE).where({ external_subscription_id: externalSubscriptionId }).select()

	if (!row) return null

	return keysToCamelCase<IBillingDbRow, IBilling>(row)
}

export const updateBillingById = async (input: {
	id: string
	updates: {
		productId?: string
		externalSubscriptionId?: string
		externalCustomerId?: string
		status?: string
		expiresAt?: Date
	}
}): Promise<IBilling> => {
	const updates: Partial<IBilling> = {
		...input.updates,
		updatedAt: new Date()
	}

	const updateData = keysToSnakeCase<Partial<IBilling>, Partial<IBillingDbRow>>(updates)

	const [row] = await knex(BILLINGS_TABLE)
		.update(updateData)
		.where({ id: input.id })
		.returning('*')

	return keysToCamelCase<IBillingDbRow, IBilling>(row)
}