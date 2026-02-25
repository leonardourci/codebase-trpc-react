import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'

import { decodeJwtToken, generateJwtToken, verifyJwtToken } from '../utils/jwt'
import { CustomError, ZodValidationError } from '../utils/errors'
import { StatusCodes } from '../utils/status-codes'
import { LoginInput, LoginResponse, SignupInput } from '../types/auth'
import { RefreshTokenInput, RefreshTokenResponse } from '../types/refreshToken'
import { TokenPurpose } from '../types/jwt'
import { createUser, getUserByEmail, getUserByGoogleId, getUserByRefreshToken, updateUserById, getUserById } from '../database/repositories/user.repository'
import { getFreeTierProduct } from '../database/repositories/product.repository'
import { getBillingByUserId } from '../database/repositories/billing.repository'
import { getUserProfile } from './user.service'
import { User, UserProfile } from '../types/user'
import globalConfig from '../utils/global-config'
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email'
import { googleTokenPayloadSchema, TGoogleTokenPayload } from '../utils/validations/google-auth.schemas'
import Logger from 'src/utils/logger'
import { Knex } from 'knex'

const { HASH_SALT } = process.env

const logger = new Logger({ source: 'AUTH-SERVICE' })

async function verifyGoogleCredential({ credential }: { credential: string }): Promise<TGoogleTokenPayload> {
	const client = new OAuth2Client(globalConfig.googleClientId)

	try {
		const ticket = await client.verifyIdToken({
			idToken: credential,
			audience: globalConfig.googleClientId
		})
		const payload = ticket.getPayload()

		if (!payload) {
			throw new CustomError('Empty token payload', StatusCodes.UNAUTHORIZED)
		}

		const { data, error } = googleTokenPayloadSchema.safeParse(payload)

		if (error) {
			throw new ZodValidationError(error)
		}

		return data
	} catch (error) {
		logger.error('Google credential verification failed:', error)

		if (error instanceof CustomError || error instanceof ZodValidationError) {
			throw error
		}

		// Generic error for other cases (network issues, invalid signature, etc.)
		throw new CustomError('Invalid Google token', StatusCodes.UNAUTHORIZED)
	}
}

export interface IGoogleAuthInput {
	credential: string
}

const generateTokens = ({ userId }: { userId: User['id'] }): { accessToken: string; refreshToken: string } => ({
	accessToken: generateJwtToken({ userId }, { expiresIn: '1h' }),
	refreshToken: generateJwtToken({ userId }, { expiresIn: '7d' })
})

async function hasExpiredSubscription({ userId }: { userId: User['id'] }): Promise<boolean> {
	const billing = await getBillingByUserId({ userId })

	if (!billing || !billing.expiresAt) {
		return false
	}

	return new Date(billing.expiresAt).getTime() < new Date().getTime()
}

export async function downgradeToFreeTier({ userId }: { userId: User['id'] }, trx?: Knex.Transaction): Promise<void> {
	const defaultProduct = await getFreeTierProduct()
	await updateUserById({ id: userId, updates: { currentProductId: defaultProduct.id } }, trx)
}

export async function authenticateWithGoogle(input: IGoogleAuthInput): Promise<LoginResponse> {
	const { credential } = input

	const payload = await verifyGoogleCredential({ credential })

	// after validation within `verifyGoogleCredential`, the email, googleId and name can't be undefined
	const googleId = payload.sub!
	const email = payload.email!
	const fullName = payload.name!

	let userByGoogleId = await getUserByGoogleId({ googleId })

	if (!userByGoogleId) {
		const userByEmail = await getUserByEmail({ email })

		if (userByEmail) {
			// Link Google account to existing user
			userByGoogleId = await updateUserById({
				id: userByEmail.id,
				updates: { googleId, emailVerified: true }
			})
		} else {
			// Create new user with random password hash
			const randomPassword = crypto.randomUUID()
			const passwordHash = bcrypt.hashSync(randomPassword, Number(globalConfig.hashSalt))

			const defaultProduct = await getFreeTierProduct()

			userByGoogleId = await createUser({
				email,
				fullName,
				phone: '',
				age: 0,
				passwordHash,
				googleId,
				currentProductId: defaultProduct.id,

				// If the user is loggin in with Google, we assume that the email is correct.
				emailVerified: true
			})
		}
	}

	if (await hasExpiredSubscription({ userId: userByGoogleId.id })) {
		await downgradeToFreeTier({ userId: userByGoogleId.id })
	}

	const { accessToken, refreshToken } = generateTokens({ userId: userByGoogleId.id })

	await updateUserById({ id: userByGoogleId.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken
	}
}

export async function authenticateUser(input: LoginInput): Promise<LoginResponse> {
	const user = await getUserByEmail({ email: input.email })

	if (!user) throw new CustomError('Email or password is wrong', StatusCodes.UNAUTHORIZED)

	const isValidPassword = bcrypt.compareSync(input.password, user.passwordHash)

	if (!isValidPassword) throw new CustomError('Email or password is wrong', StatusCodes.UNAUTHORIZED)

	if (await hasExpiredSubscription({ userId: user.id })) {
		await downgradeToFreeTier({ userId: user.id })
	}

	const { accessToken, refreshToken } = generateTokens({ userId: user.id })

	await updateUserById({ id: user.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken
	}
}

export async function registerUser({ password, ...input }: SignupInput): Promise<UserProfile> {
	const passwordHash = bcrypt.hashSync(password, Number(HASH_SALT) || 10)

	const defaultProduct = await getFreeTierProduct()

	const user = await createUser({
		passwordHash,
		...input,
		emailVerified: false,
		currentProductId: defaultProduct.id
	})

	const verificationToken = generateJwtToken({ userId: user.id, purpose: TokenPurpose.EMAIL_VERIFICATION }, { expiresIn: '30m' })

	await updateUserById({
		id: user.id,
		updates: { emailVerificationToken: verificationToken }
	})

	try {
		await sendVerificationEmail({
			to: user.email,
			fullName: user.fullName,
			verificationToken
		})
	} catch (error) {
		console.error('Failed to send verification email:', error)
		// Continue - because user can resend later
	}

	const userProfile = await getUserProfile({ userId: user.id })

	if (!userProfile) {
		throw new CustomError('Failed to retrieve user profile', StatusCodes.INTERNAL_SERVER_ERROR)
	}

	return userProfile
}

export async function refreshAccessToken(input: RefreshTokenInput): Promise<RefreshTokenResponse> {
	verifyJwtToken({ token: input.refreshToken })

	const user = await getUserByRefreshToken({ refreshToken: input.refreshToken })

	if (!user) {
		throw new CustomError('Invalid refresh token', StatusCodes.UNAUTHORIZED)
	}

	if (await hasExpiredSubscription({ userId: user.id })) {
		await downgradeToFreeTier({ userId: user.id })
	}

	const { accessToken, refreshToken } = generateTokens({ userId: user.id })

	await updateUserById({ id: user.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken: refreshToken
	}
}

export async function revokeUserRefreshToken({ userId }: { userId: string }): Promise<void> {
	await updateUserById({ id: userId, updates: { refreshToken: undefined } })
}

export async function verifyUserEmail({ token }: { token: string }): Promise<void> {
	verifyJwtToken({ token })
	const decoded = decodeJwtToken({ token })

	if (decoded.purpose !== TokenPurpose.EMAIL_VERIFICATION) {
		throw new CustomError('Invalid verification token', StatusCodes.BAD_REQUEST)
	}

	const user = await getUserById({ id: decoded.userId })

	if (!user) {
		throw new CustomError('Invalid verification token', StatusCodes.BAD_REQUEST)
	}

	// Prevent token reuse after resend
	if (user.emailVerificationToken !== token) {
		throw new CustomError('Invalid or expired verification token', StatusCodes.BAD_REQUEST)
	}

	if (user.emailVerified) {
		return
	}

	await updateUserById({
		id: user.id,
		updates: {
			emailVerified: true,
			emailVerificationToken: undefined
		}
	})
}

export async function resendVerificationEmail({ userId }: { userId: string }): Promise<void> {
	const user = await getUserById({ id: userId })

	if (!user) {
		throw new CustomError('User not found', StatusCodes.NOT_FOUND)
	}

	if (user.emailVerified) {
		throw new CustomError('Email already verified', StatusCodes.BAD_REQUEST)
	}

	const verificationToken = generateJwtToken({ userId: user.id, purpose: TokenPurpose.EMAIL_VERIFICATION }, { expiresIn: '30m' })

	await updateUserById({
		id: user.id,
		updates: { emailVerificationToken: verificationToken }
	})

	await sendVerificationEmail({
		to: user.email,
		fullName: user.fullName,
		verificationToken
	})
}

export async function forgotPassword({ email }: { email: string }): Promise<void> {
	const user = await getUserByEmail({ email })

	// Don't reveal if user exists - always return success
	if (!user) {
		return
	}

	const resetToken = generateJwtToken({ userId: user.id, purpose: TokenPurpose.PASSWORD_RESET }, { expiresIn: '15m' })

	await sendPasswordResetEmail({
		to: user.email,
		fullName: user.fullName,
		resetToken
	})
}

export async function resetPassword({ token, newPassword }: { token: string; newPassword: string }): Promise<void> {
	verifyJwtToken({ token })
	const decoded = decodeJwtToken({ token })

	if (decoded.purpose !== TokenPurpose.PASSWORD_RESET) {
		throw new CustomError('Invalid reset token', StatusCodes.BAD_REQUEST)
	}

	const user = await getUserById({ id: decoded.userId })

	if (!user) {
		throw new CustomError('Invalid reset token', StatusCodes.BAD_REQUEST)
	}

	const passwordHash = bcrypt.hashSync(newPassword, Number(globalConfig.hashSalt))

	// Update password and invalidate all refresh tokens (force re-login)
	await updateUserById({
		id: user.id,
		updates: {
			passwordHash,
			refreshToken: undefined
		}
	})
}
