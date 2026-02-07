import { getUserByEmail, getUserById, updateUserById } from '../database/repositories/user.repository'
import { IUser, IUserProfile } from '../types/user'
import {
	EMAIL_CHANGE_COOLDOWN_MS,
	EMAIL_CHANGE_TOKEN_EXPIRATION_MINUTES,
	generateSixDigitsVerificationCode,
	MAX_VERIFICATION_ATTEMPTS,
	sendEmailChangeCode
} from '../utils/email'
import { MILLISECONDS_PER_SECOND } from '../utils/time'
import { ETokenPurpose, TToken } from '../types/jwt'
import { CustomError } from '../utils/errors'
import { decodeJwtToken, generateJwtToken, verifyJwtToken } from '../utils/jwt'
import { EStatusCodes } from '../utils/status-codes'
import { getUserProfile } from './user.service'

export interface ISendVerificationEmailInput {
	to: string
	fullName: string
	verificationToken: string
}

export interface ISendPasswordResetEmailInput {
	to: string
	fullName: string
	resetToken: string
}

function checkTokenCooldown({ user, currentDateTimestamp }: { user: IUser; currentDateTimestamp: number }): void {
	if (user.emailVerificationToken) {
		try {
			verifyJwtToken({ token: user.emailVerificationToken })
			const existing = decodeJwtToken({ token: user.emailVerificationToken })
			const lastRequestedAt = existing.iat ? existing.iat * MILLISECONDS_PER_SECOND : currentDateTimestamp
			const elapsedMs = currentDateTimestamp - lastRequestedAt
			const cooldownExpired = elapsedMs >= EMAIL_CHANGE_COOLDOWN_MS

			if (!cooldownExpired) {
				const remainingMs = EMAIL_CHANGE_COOLDOWN_MS - elapsedMs
				const secondsRemaining = Math.ceil(remainingMs / MILLISECONDS_PER_SECOND)
				throw new CustomError(`Please wait ${secondsRemaining} seconds before requesting a new code`, EStatusCodes.BAD_REQUEST)
			}
		} catch (error) {
			// Invalid token, proceed with new token
		}
	}
}

async function verifyEmailChangeCode({ userId, code, tokenData }: { userId: IUser['id']; code: string; tokenData: TToken }) {
	if (tokenData.purpose !== ETokenPurpose.EMAIL_CHANGE) {
		throw new CustomError('Invalid token purpose', EStatusCodes.BAD_REQUEST)
	}

	if (tokenData.code !== code) {
		// Regenerate JWT with preserved exp timestamp and incremented attempts
		const now = Date.now()
		const secondsRemaining = tokenData.exp ? Math.max(tokenData.exp - Math.floor(now / MILLISECONDS_PER_SECOND), 1) : EMAIL_CHANGE_TOKEN_EXPIRATION_MINUTES * 60
		const newToken = generateJwtToken(
			{
				userId: tokenData.userId,
				purpose: ETokenPurpose.EMAIL_CHANGE,
				code: tokenData.code,
				newEmail: tokenData.newEmail,
				attempts: tokenData.attempts + 1,
				iat: tokenData.iat
			},
			{ expiresIn: secondsRemaining }
		)

		await updateUserById({
			id: userId,
			updates: {
				emailVerificationToken: newToken
			}
		})

		const attemptsRemaining = MAX_VERIFICATION_ATTEMPTS - (tokenData.attempts + 1)
		throw new CustomError(`Invalid code. You have ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining`, EStatusCodes.BAD_REQUEST)
	}
}

export async function requestEmailChange(input: { userId: IUser['id']; newEmail: string }): Promise<{ success: boolean; message: string }> {
	const { userId, newEmail } = input

	const user = await getUserById({ id: userId })
	if (!user) {
		throw new CustomError('User not found', EStatusCodes.NOT_FOUND)
	}

	if (user.email === newEmail) {
		throw new CustomError('New email must be different from current email', EStatusCodes.BAD_REQUEST)
	}

	const existingUser = await getUserByEmail({ email: newEmail })
	if (existingUser) {
		throw new CustomError('This email is already in use', EStatusCodes.CONFLICT)
	}

	const currentDateTimestamp = Date.now()

	checkTokenCooldown({ user, currentDateTimestamp })

	const code = generateSixDigitsVerificationCode()

	const token = generateJwtToken(
		{
			userId,
			purpose: ETokenPurpose.EMAIL_CHANGE,
			code,
			newEmail,
			attempts: 0,
			iat: Math.floor(currentDateTimestamp / MILLISECONDS_PER_SECOND)
		},
		{ expiresIn: `${EMAIL_CHANGE_TOKEN_EXPIRATION_MINUTES}m` }
	)

	await updateUserById({
		id: userId,
		updates: {
			emailVerificationToken: token
		}
	})

	await sendEmailChangeCode({
		to: newEmail,
		fullName: user.fullName,
		code
	})

	return {
		success: true,
		message: 'Verification code sent to new email address'
	}
}

export async function verifyEmailChange(input: { userId: IUser['id']; code: string }): Promise<IUserProfile> {
	const user = await getUserById({ id: input.userId })
	if (!user || !user.emailVerificationToken) {
		throw new CustomError('No pending email change found', EStatusCodes.BAD_REQUEST)
	}

	verifyJwtToken({ token: user.emailVerificationToken })
	const tokenData = decodeJwtToken({ token: user.emailVerificationToken })

	// Validate purpose and required fields
	if (tokenData.purpose !== ETokenPurpose.EMAIL_CHANGE) {
		throw new CustomError('Invalid token purpose', EStatusCodes.BAD_REQUEST)
	}

	if (!tokenData.code || !tokenData.newEmail || tokenData.attempts === undefined) {
		throw new CustomError('Invalid verification data', EStatusCodes.BAD_REQUEST)
	}

	if (tokenData.attempts >= MAX_VERIFICATION_ATTEMPTS) {
		throw new CustomError('Too many failed attempts. Please request a new code', EStatusCodes.BAD_REQUEST)
	}

	verifyEmailChangeCode({ code: input.code, userId: input.userId, tokenData })

	// Code is valid - check email still available (race condition prevention)
	const existingUser = await getUserByEmail({ email: tokenData.newEmail })
	if (existingUser && existingUser.id !== input.userId) {
		throw new CustomError('This email is already in use', EStatusCodes.CONFLICT)
	}

	await updateUserById({
		id: input.userId,
		updates: {
			googleId: null,
			email: tokenData.newEmail,
			emailVerificationToken: null,
			emailVerified: true
		}
	})

	const updatedUser = await getUserProfile({ userId: input.userId })
	if (!updatedUser) {
		throw new CustomError('Failed to fetch updated profile', EStatusCodes.INTERNAL_SERVER_ERROR)
	}

	return updatedUser
}
