import { getUserByEmail, getUserById, updateUserById } from '../database/repositories/user.repository'
import {
	createBilling,
	getBillingByUserId as getBillingByUserId,
	updateBillingByUserId,
	getBillingByExternalSubscriptionId,
	updateBillingById
} from '../database/repositories/billing.repository'
import { getFreeTierProduct } from '../database/repositories/product.repository'
import { CustomError } from '../utils/errors'
import { EStatusCodes } from '../utils/status-codes'
import { unixTimestampToDate } from '../utils/time'
import { IUpdateUserBillingInput } from '../types/billing'

async function hasUserVerifiedEmail({ userId }: { userId: string }): Promise<void> {
	const user = await getUserById({ id: userId })

	if (!user) {
		throw new CustomError('User not found', EStatusCodes.UNAUTHORIZED)
	}

	if (!user.emailVerified) {
		throw new CustomError('Please verify your email before making a purchase', EStatusCodes.FORBIDDEN)
	}
}

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
	} else {
		console.log('[SERVICE] Updating existing billing record:', { billingId: billing.id })
		await updateBillingById({
			id: billing.id as string,
			updates: {
				productId: input.productId,
				externalSubscriptionId: input.externalSubscriptionId,
				externalCustomerId: input.externalCustomerId,
				status: 'active',
				expiresAt: expiresAtDate
			}
		})
	}

	console.log('[SERVICE] Updating user.productId to:', input.productId)
	await updateUserById({
		id: user.id,
		updates: { productId: input.productId }
	})

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
