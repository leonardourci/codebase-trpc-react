import knex from '../knex'
import { CreateBilling, Billing, BillingDbRow } from '../../types/billing'
import { User } from '../../types/user'
import { keysToCamelCase, keysToSnakeCase } from '../../utils/case-conversion'

const BILLINGS_TABLE = 'billings'

export const createBilling = async (input: CreateBilling): Promise<Billing> => {
	const insertData = keysToSnakeCase<CreateBilling, Partial<BillingDbRow>>(input)

	const [row] = await knex(BILLINGS_TABLE)
		.insert(insertData)
		.returning('*')

	return keysToCamelCase<BillingDbRow, Billing>(row)
}

export const getBillingByUserId = async ({ userId }: { userId: User['id'] }): Promise<Billing | null> => {
	const [row] = await knex(BILLINGS_TABLE).where({ user_id: userId }).select()

	if (!row) return null

	return keysToCamelCase<BillingDbRow, Billing>(row)
}

export const updateBillingByUserId = async (input: { id: string; expiresAt: Date }): Promise<Billing> => {
	const updateData = keysToSnakeCase<Partial<Billing>, Partial<BillingDbRow>>({
		expiresAt: input.expiresAt,
		updatedAt: new Date()
	})

	const [row] = await knex(BILLINGS_TABLE)
		.update(updateData)
		.where({ id: input.id })
		.returning('*')

	return keysToCamelCase<BillingDbRow, Billing>(row)
}

export const getBillingByExternalSubscriptionId = async ({ externalSubscriptionId }: { externalSubscriptionId: string }): Promise<Billing | null> => {
	const [row] = await knex(BILLINGS_TABLE).where({ external_subscription_id: externalSubscriptionId }).select()

	if (!row) return null

	return keysToCamelCase<BillingDbRow, Billing>(row)
}

export const updateBillingById = async (input: { id: string; status?: string; expiresAt?: Date }): Promise<Billing> => {
	const updates: Partial<Billing> = { updatedAt: new Date() }
	if (input.status) updates.status = input.status
	if (input.expiresAt) updates.expiresAt = input.expiresAt

	const updateData = keysToSnakeCase<Partial<Billing>, Partial<BillingDbRow>>(updates)

	const [row] = await knex(BILLINGS_TABLE)
		.update(updateData)
		.where({ id: input.id })
		.returning('*')

	return keysToCamelCase<BillingDbRow, Billing>(row)
}