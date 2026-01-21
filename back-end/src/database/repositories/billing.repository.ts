import knex from '../knex'
import Billing from '../models/Billing.model'
import { ICreateBilling, IBilling } from '../../types/billing'
import { IUser } from '../../types/user'

export const createBilling = async (input: ICreateBilling): Promise<IBilling> => {
	const [row] = await knex(Billing.tableName)
		.insert({
			user_id: input.userId,
			product_id: input.productId,
			external_payment_intent_id: input.externalPaymentIntentId,
			external_subscription_id: input.externalSubscriptionId,
			external_customer_id: input.externalCustomerId,
			status: input.status,
			expires_at: input.expiresAt
		})
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

	return new Billing({
		id: row.id,
		userId: row.user_id,
		productId: row.product_id,
		externalPaymentIntentId: row.external_payment_intent_id,
		externalSubscriptionId: row.external_subscription_id,
		externalCustomerId: row.external_customer_id,
		status: row.status,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toJSON()
}

export const getBillingByUserId = async ({ userId }: { userId: IUser['id'] }): Promise<IBilling | null> => {
	const [row] = await knex(Billing.tableName).where({ user_id: userId }).select()

	if (!row) return null

	return new Billing({
		id: row.id,
		userId: row.user_id,
		productId: row.product_id,
		externalPaymentIntentId: row.external_payment_intent_id,
		externalSubscriptionId: row.external_subscription_id,
		externalCustomerId: row.external_customer_id,
		status: row.status,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toJSON()
}

export const updateBillingByUserId = async (input: { id: string; expiresAt: Date }): Promise<IBilling> => {
	const [row] = await knex(Billing.tableName)
		.update({
			expires_at: input.expiresAt,
			updated_at: new Date()
		})
		.where({ id: input.id })
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

	return new Billing({
		id: row.id,
		userId: row.user_id,
		productId: row.product_id,
		externalPaymentIntentId: row.external_payment_intent_id,
		externalSubscriptionId: row.external_subscription_id,
		externalCustomerId: row.external_customer_id,
		status: row.status,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toJSON()
}

export const getBillingByExternalSubscriptionId = async ({ externalSubscriptionId }: { externalSubscriptionId: string }): Promise<IBilling | null> => {
	const [row] = await knex(Billing.tableName).where({ external_subscription_id: externalSubscriptionId }).select()

	if (!row) return null

	return new Billing({
		id: row.id,
		userId: row.user_id,
		productId: row.product_id,
		externalPaymentIntentId: row.external_payment_intent_id,
		externalSubscriptionId: row.external_subscription_id,
		externalCustomerId: row.external_customer_id,
		status: row.status,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toJSON()
}

export const updateBillingById = async (input: { id: string; status?: string; expiresAt?: Date }): Promise<IBilling> => {
	const updates: Record<string, any> = { updated_at: new Date() }
	if (input.status) updates.status = input.status
	if (input.expiresAt) updates.expires_at = input.expiresAt

	const [row] = await knex(Billing.tableName)
		.update(updates)
		.where({ id: input.id })
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

	return new Billing({
		id: row.id,
		userId: row.user_id,
		productId: row.product_id,
		externalPaymentIntentId: row.external_payment_intent_id,
		externalSubscriptionId: row.external_subscription_id,
		externalCustomerId: row.external_customer_id,
		status: row.status,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toJSON()
}