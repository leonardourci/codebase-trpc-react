import knex from '../knex'
import Billing from '../models/Billing.model'
import { ICreateBilling, IBilling } from '../../types/billing'
import { IUser } from '../../types/user'

export const createBilling = async (payload: ICreateBilling): Promise<IBilling> => {
	const [row] = await knex
		.insert(new Billing(payload).toDatabaseFormat())
		.into(Billing.tableName)
		.returning([
			'id',
			'user_id',
			'product_id',
			'external_payment_intent_id',
			'external_subscription_id',
			'external_customer_id',
			'status',
			'expires_at',
			'created_at',
			'updated_at'
		])

	return new Billing(row).toJSON()
}

export const getBillingByUserId = async ({ userId }: { userId: IUser['id'] }): Promise<IBilling | null> => {
	const [row] = await knex(Billing.tableName).where({ user_id: userId }).select()

	if (!row) return null

	return new Billing(row).toJSON()
}

export const updateBillingByUserId = async (payload: { id: string; expiresAt: Date }): Promise<IBilling> => {
	const [row] = await knex(Billing.tableName)
		.update({
			expires_at: payload.expiresAt,
			status: 'active',
			updated_at: new Date()
		})
		.where({ id: payload.id })
		.returning([
			'id',
			'user_id',
			'product_id',
			'external_payment_intent_id',
			'external_subscription_id',
			'external_customer_id',
			'status',
			'expires_at',
			'created_at',
			'updated_at'
		])

	return new Billing(row).toJSON()
}
