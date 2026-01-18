import knex from '../knex'
import Billing from '../models/Billing.model'
import { ICreateBilling, IBilling } from '../../types/billing'
import { IUser } from '../../types/user'

export const createBilling = async (payload: ICreateBilling): Promise<IBilling> => {
	const [row] = await knex
		.insert(payload)
		.into(Billing.tableName)
		.returning([
			'id',
			'user_id',
			'product_id',
			'stripe_payment_intent_id',
			'stripe_subscription_id',
			'stripe_customer_id',
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
			'stripe_payment_intent_id',
			'stripe_subscription_id',
			'stripe_customer_id',
			'status',
			'expires_at',
			'created_at',
			'updated_at'
		])

	return new Billing(row).toJSON()
}
