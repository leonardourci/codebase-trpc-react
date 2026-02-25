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
import { StatusCodes } from '../utils/status-codes'
import { unixTimestampToDate } from '../utils/time'
import { UpdateUserBillingInput } from '../types/billing'

async function hasUserVerifiedEmail({ userId }: { userId: string }): Promise<void> {
	const user = await getUserById({ id: userId })

	if (!user) {
		throw new CustomError('User not found', StatusCodes.UNAUTHORIZED)
	}

	if (!user.emailVerified) {
		throw new CustomError(
			'Please verify your email before making a purchase',
			StatusCodes.FORBIDDEN
		)
	}
}

export const registerUserBilling = async (input: UpdateUserBillingInput) => {
	const user = await getUserByEmail({ email: input.userEmail })
	if (!user) {
		throw new Error(`User with email "${input.userEmail}" not found`)
	}

	await hasUserVerifiedEmail({ userId: user.id })

	const billing = await getBillingByUserId({ userId: user.id })
	if (!billing) {
		await createBilling({
			userId: user.id,
			productId: input.productId,
			externalSubscriptionId: input.externalSubscriptionId,
			externalCustomerId: input.externalCustomerId,
			status: 'active',
			expiresAt: unixTimestampToDate(input.expiresAt)
		})
	} else {
		await updateBillingByUserId({
			id: billing.id as string,
			expiresAt: unixTimestampToDate(input.expiresAt)
		})
	}

	await updateUserById({
		id: user.id,
		updates: { currentProductId: input.productId }
	})
}

export const updateBillingOnPaymentFailed = async (externalSubscriptionId: string) => {
	if (!externalSubscriptionId) return
	const billing = await getBillingByExternalSubscriptionId({ externalSubscriptionId })
	if (!billing) return
	await updateBillingById({ id: billing.id as string, status: 'past_due' })
}

export const updateBillingOnSubscriptionUpdated = async (input: { externalSubscriptionId: string; status?: string; currentPeriodEnd: Date }) => {
	if (!input.externalSubscriptionId) return
	const billing = await getBillingByExternalSubscriptionId({ externalSubscriptionId: input.externalSubscriptionId })
	if (!billing) return
	await updateBillingById({
		id: billing.id as string,
		status: input.status,
		expiresAt: input.currentPeriodEnd
	})
}

export const updateBillingOnSubscriptionDeleted = async (externalSubscriptionId: string) => {
	if (!externalSubscriptionId) return
	const billing = await getBillingByExternalSubscriptionId({ externalSubscriptionId })
	if (!billing) return

	await updateBillingById({
		id: billing.id as string,
		status: 'canceled',
		expiresAt: new Date()
	})

	const defaultProduct = await getFreeTierProduct()
	await updateUserById({
		id: billing.userId,
		updates: { currentProductId: defaultProduct.id }
	})
}
