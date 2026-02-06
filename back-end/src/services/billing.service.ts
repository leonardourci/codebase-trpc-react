import { createBilling, getBillingByExternalSubscriptionId, getBillingByUserId, updateBillingById } from '../database/repositories/billing.repository'
import { getFreeTierProduct } from '../database/repositories/product.repository'
import { getUserByEmail, updateUserById } from '../database/repositories/user.repository'
import { IUpdateUserBillingInput } from '../types/billing'
import { unixTimestampToDate } from '../utils/time'

export const registerUserBilling = async (input: IUpdateUserBillingInput) => {
	console.log('[SERVICE] registerUserBilling - Input:', {
		userEmail: input.userEmail,
		productId: input.productId,
		expiresAtUnix: input.expiresAt,
		expiresAtConverted: unixTimestampToDate(input.expiresAt)
	})

	const user = await getUserByEmail({ email: input.userEmail })
	if (!user) {
		throw new Error(`User with email "${input.userEmail}" not found`)
	}

	console.log('[SERVICE] User found:', { userId: user.id, currentProductId: user.productId })

	// Email verification removed - already checked at checkout creation via verifiedEmailProcedure
	// Renewals are automatic and shouldn't be blocked by verification status changes

	const billing = await getBillingByUserId({ userId: user.id })
	const expiresAtDate = unixTimestampToDate(input.expiresAt)

	if (!billing) {
		console.log('[SERVICE] Creating new billing record')
		await createBilling({
			userId: user.id,
			productId: input.productId,
			externalSubscriptionId: input.externalSubscriptionId,
			externalCustomerId: input.externalCustomerId,
			status: 'active',
			expiresAt: expiresAtDate
		})

		await updateUserById({
			id: user.id,
			updates: { productId: input.productId }
		})
	} else {
		await updateBillingById({
			id: billing.id as string,
			updates: {
				externalSubscriptionId: input.externalSubscriptionId,
				externalCustomerId: input.externalCustomerId,
				status: 'active'
			}
		})
	}

	console.log('[SERVICE] registerUserBilling - Completed')
}

export const updateBillingOnPaymentFailed = async (externalSubscriptionId: string) => {
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

	await updateBillingById({
		id: billing.id as string,
		updates: {
			productId: input.productId,
			status: input.status,
			expiresAt: input.currentPeriodEnd
		}
	})

	if (input.status === 'canceled' || input.status === 'unpaid') {
		console.log('[SERVICE] Subscription became canceled/unpaid, downgrading to free tier')
		const defaultProduct = await getFreeTierProduct()
		await updateUserById({
			id: billing.userId,
			updates: { productId: defaultProduct.id }
		})
	} else if (input.productId && input.productId !== billing.productId) {
		// If productId changed and subscription is still active/past_due, update user's productId
		console.log('[SERVICE] Product changed in subscription, updating user:', {
			oldProductId: billing.productId,
			newProductId: input.productId
		})
		await updateUserById({
			id: billing.userId,
			updates: { productId: input.productId }
		})
	}
}

export const updateBillingOnSubscriptionDeleted = async (externalSubscriptionId: string) => {
	if (!externalSubscriptionId) return
	const billing = await getBillingByExternalSubscriptionId({ externalSubscriptionId })
	if (!billing) return

	await updateBillingById({
		id: billing.id as string,
		updates: {
			status: 'canceled',
			expiresAt: new Date()
		}
	})

	const defaultProduct = await getFreeTierProduct()
	await updateUserById({
		id: billing.userId,
		updates: { productId: defaultProduct.id }
	})
}
