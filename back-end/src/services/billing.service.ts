import db from '../database/knex'
import { createBilling, getBillingByExternalSubscriptionId, getBillingByUserId, updateBillingById } from '../database/repositories/billing.repository'
import { getFreeTierProduct } from '../database/repositories/product.repository'
import { getUserByEmail, updateUserById } from '../database/repositories/user.repository'
import { IUpdateUserBillingInput } from '../types/billing'
import { unixTimestampToDate } from '../utils/time'

export const registerUserBilling = async (input: IUpdateUserBillingInput) => {
	const user = await getUserByEmail({ email: input.userEmail })
	if (!user) {
		throw new Error(`User with email "${input.userEmail}" not found`)
	}

	// Email verification removed - already checked at checkout creation via verifiedEmailProcedure
	// Renewals are automatic and shouldn't be blocked by verification status changes
	const billing = await getBillingByUserId({ userId: user.id })
	const expiresAtDate = unixTimestampToDate(input.expiresAt)

	await db.transaction(async (trx) => {
		if (!billing) {
			await createBilling(
				{
					userId: user.id,
					productId: input.productId,
					externalSubscriptionId: input.externalSubscriptionId,
					externalCustomerId: input.externalCustomerId,
					status: 'active',
					expiresAt: expiresAtDate
				},
				trx
			)
		} else {
			await updateBillingById(
				{
					id: billing.id as string,
					updates: {
						productId: input.productId,
						externalSubscriptionId: input.externalSubscriptionId,
						externalCustomerId: input.externalCustomerId,
						status: 'active',
						expiresAt: expiresAtDate
					}
				},
				trx
			)
		}

		await updateUserById(
			{
				id: user.id,
				updates: { productId: input.productId }
			},
			trx
		)
	})
}

export const updateBillingOnPaymentFailed = async ({ externalSubscriptionId }: { externalSubscriptionId: string }) => {
	if (!externalSubscriptionId) return
	const billing = await getBillingByExternalSubscriptionId({ externalSubscriptionId })
	if (!billing) return

	await updateBillingById({
		id: billing.id as string,
		updates: { status: 'past_due' }
	})
}

export const updateBillingOnSubscriptionUpdated = async (input: {
	externalSubscriptionId: string
	productId?: string
	status?: string
	currentPeriodEnd: Date
}) => {
	if (!input.externalSubscriptionId) return
	const billing = await getBillingByExternalSubscriptionId({ externalSubscriptionId: input.externalSubscriptionId })
	if (!billing) return

	await db.transaction(async (trx) => {
		await updateBillingById(
			{
				id: billing.id as string,
				updates: {
					...(input.productId && { productId: input.productId }),
					...(input.status && { status: input.status }),
					expiresAt: input.currentPeriodEnd
				}
			},
			trx
		)

		if (input.status === 'canceled' || input.status === 'unpaid') {
			const defaultProduct = await getFreeTierProduct()
			await updateUserById(
				{
					id: billing.userId,
					updates: { productId: defaultProduct.id }
				},
				trx
			)
		} else if (input.productId && input.productId !== billing.productId) {
			await updateUserById(
				{
					id: billing.userId,
					updates: { productId: input.productId }
				},
				trx
			)
		}
	})
}

export const updateBillingOnSubscriptionDeleted = async ({ externalSubscriptionId }: { externalSubscriptionId: string }) => {
	if (!externalSubscriptionId) return
	const billing = await getBillingByExternalSubscriptionId({ externalSubscriptionId })
	if (!billing) return

	await db.transaction(async (trx) => {
		await updateBillingById(
			{
				id: billing.id as string,
				updates: {
					status: 'canceled',
					expiresAt: new Date()
				}
			},
			trx
		)

		const defaultProduct = await getFreeTierProduct()
		await updateUserById(
			{
				id: billing.userId,
				updates: { productId: defaultProduct.id }
			},
			trx
		)
	})
}
