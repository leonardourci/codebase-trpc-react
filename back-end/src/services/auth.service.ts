import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'

import { generateJwtToken, verifyJwtToken, verifyJwtTokenSimple } from '../utils/jwt'
import { CustomError } from '../utils/errors'
import { StatusCodes } from '../utils/status-codes'
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service'
import { LoginInput, LoginResponse, SignupInput } from '../types/auth'
import { RefreshTokenInput, RefreshTokenResponse } from '../types/refreshToken'
import { TokenPurpose } from '../types/jwt'
import {
	createUser,
	getUserByEmail,
	getUserByGoogleId,
	getUserByRefreshToken,
	updateUserById,
	getUserById
} from '../database/repositories/user.repository'
import { getFreeTierProduct } from '../database/repositories/product.repository'
import { removeUserSensitive } from './user.service'
import { User, UserProfile } from '../types/user'
import globalConfig from '../utils/global-config'
import Logger from '../utils/logger'

const logger = new Logger({ source: 'auth.service' })
const { HASH_SALT } = process.env

const client = new OAuth2Client(globalConfig.googleClientId)

export interface IGoogleAuthInput {
	credential: string
}

const generateTokens = ({ userId }: { userId: User['id'] }): { accessToken: string, refreshToken: string } => ({
	accessToken: generateJwtToken({ userId }, { expiresIn: '1h' }),
	refreshToken: generateJwtToken({ userId }, { expiresIn: '7d' })
})

export async function authenticateWithGoogle(input: IGoogleAuthInput): Promise<LoginResponse> {
	const { credential } = input

	let payload
	try {
		const ticket = await client.verifyIdToken({
			idToken: credential,
			audience: globalConfig.googleClientId
		})
		payload = ticket.getPayload()
	} catch {
		throw new CustomError('Invalid Google token', StatusCodes.UNAUTHORIZED)
	}

	if (!payload || !payload.sub || !payload.email) {
		throw new CustomError('Invalid Google token payload', StatusCodes.UNAUTHORIZED)
	}

	const googleId = payload.sub
	const email = payload.email
	const fullName = payload.name || 'Google User'

	let user = await getUserByGoogleId({ googleId })

	if (!user) {
		const existingUser = await getUserByEmail({ email })

		if (existingUser) {
			user = await updateUserById({
				id: existingUser.id,
				updates: { googleId, emailVerified: true }
			})
		} else {
			const randomPassword = crypto.randomUUID()
			const passwordHash = bcrypt.hashSync(randomPassword, Number(globalConfig.hashSalt))

			const defaultProduct = await getFreeTierProduct()

			user = await createUser({
				email,
				fullName,
				phone: '',
				age: 0,
				passwordHash,
				googleId,
				currentProductId: defaultProduct.id,

				// Google login means email is verified by Google.
				emailVerified: true
			})
		}
	}

	const { accessToken, refreshToken } = generateTokens({ userId: user.id })

	await updateUserById({ id: user.id, updates: { refreshToken } })

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

	const { accessToken, refreshToken } = generateTokens({ userId: user.id })

	await updateUserById({ id: user.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken
	}
}

export async function registerUser({ password, ...input }: SignupInput): Promise<UserProfile> {
	const passwordHash = bcrypt.hashSync(password, Number(HASH_SALT) ?? '')

	const defaultProduct = await getFreeTierProduct()

	const user = await createUser({
		...input,
		passwordHash,
		emailVerified: false,
		currentProductId: defaultProduct.id
	})

	const verificationToken = generateJwtToken(
		{ userId: user.id, purpose: TokenPurpose.EMAIL_VERIFICATION },
		{ expiresIn: '30m' }
	)

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
		logger.error('Failed to send verification email', { error })
		// Continue - user can resend via the resend endpoint
	}

	return removeUserSensitive({ user })
}

export async function refreshAccessToken(input: RefreshTokenInput): Promise<RefreshTokenResponse> {
	verifyJwtToken({ token: input.refreshToken })

	const user = await getUserByRefreshToken({ refreshToken: input.refreshToken })

	if (!user) {
		throw new CustomError('Invalid refresh token', StatusCodes.UNAUTHORIZED)
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
	const decoded = verifyJwtTokenSimple({ token })

	if (decoded.purpose !== TokenPurpose.EMAIL_VERIFICATION) {
		throw new CustomError('Invalid verification token', StatusCodes.BAD_REQUEST)
	}

	const user = await getUserById({ id: decoded.userId })

	if (!user) {
		throw new CustomError('Invalid verification token', StatusCodes.BAD_REQUEST)
	}

	// Verify token matches what's stored (prevent token reuse after resend)
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

	const verificationToken = generateJwtToken(
		{ userId: user.id, purpose: TokenPurpose.EMAIL_VERIFICATION },
		{ expiresIn: '30m' }
	)

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

	const resetToken = generateJwtToken(
		{ userId: user.id, purpose: TokenPurpose.PASSWORD_RESET },
		{ expiresIn: '15m' }
	)

	await sendPasswordResetEmail({
		to: user.email,
		fullName: user.fullName,
		resetToken
	})
}

export async function resetPassword({ token, newPassword }: { token: string; newPassword: string }): Promise<void> {
	const decoded = verifyJwtTokenSimple({ token })

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