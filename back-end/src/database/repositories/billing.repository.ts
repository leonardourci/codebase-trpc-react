import { type Knex } from 'knex'
import knex from '../knex'
import { CreateBilling, Billing, BillingDbRow } from 'src/types/billing'
import { User } from 'src/types/user'
import { keysToCamelCase, keysToSnakeCase } from 'src/utils/case-conversion'

export const BILLINGS_TABLE = 'billings'

export const createBilling = async (input: CreateBilling, trx?: Knex.Transaction): Promise<Billing> => {
	const db = trx || knex
	const insertData = keysToSnakeCase<CreateBilling, Partial<BillingDbRow>>(input)

	const [row] = await db(BILLINGS_TABLE).insert(insertData).returning('*')

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

	const [row] = await knex(BILLINGS_TABLE).update(updateData).where({ id: input.id }).returning('*')

	return keysToCamelCase<BillingDbRow, Billing>(row)
}

export const getBillingByExternalSubscriptionId = async ({ externalSubscriptionId }: { externalSubscriptionId: string }): Promise<Billing | null> => {
	const [row] = await knex(BILLINGS_TABLE).where({ external_subscription_id: externalSubscriptionId }).select()

	if (!row) return null

	return keysToCamelCase<BillingDbRow, Billing>(row)
}

export const updateBillingById = async (
	input: {
		id: string
		updates: {
			productId?: string
			externalSubscriptionId?: string
			externalCustomerId?: string
			status?: string
			expiresAt?: Date
		}
	},
	trx?: Knex.Transaction
): Promise<Billing> => {
	const db = trx || knex
	const updates: Partial<Billing> = {
		...input.updates,
		updatedAt: new Date()
	}

	const updateData = keysToSnakeCase<Partial<Billing>, Partial<BillingDbRow>>(updates)

	const [row] = await db(BILLINGS_TABLE).update(updateData).where({ id: input.id }).returning('*')

	return keysToCamelCase<BillingDbRow, Billing>(row)
}
