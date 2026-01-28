import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'

import { generateJwtToken, verifyJwtToken } from '../utils/jwt'
import { CustomError } from '../utils/errors'
import { EStatusCodes } from '../utils/status-codes'
import { TLoginInput, ILoginResponse, TSignupInput } from '../types/auth'
import { TRefreshTokenInput, IRefreshTokenResponse } from '../types/refreshToken'
import {
	createUser,
	getUserByEmail,
	getUserByGoogleId,
	getUserByRefreshToken,
	updateUserById
} from '../database/repositories/user.repository'
import { removeUserSensitive } from './user.service'
import { IUser, IUserProfile } from '../types/user'
import globalConfig from '../utils/global-config'

const { HASH_SALT } = process.env

const client = new OAuth2Client(globalConfig.googleClientId)

export interface IGoogleAuthInput {
	credential: string
}

const generateTokens = ({ userId }: { userId: IUser['id'] }): { accessToken: string, refreshToken: string } => ({
	accessToken: generateJwtToken({ userId }, { expiresIn: '1h' }),
	refreshToken: generateJwtToken({ userId }, { expiresIn: '7d' })
})

export async function authenticateWithGoogle(input: IGoogleAuthInput): Promise<ILoginResponse> {
	const { credential } = input

	let payload
	try {
		const ticket = await client.verifyIdToken({
			idToken: credential,
			audience: globalConfig.googleClientId
		})
		payload = ticket.getPayload()
	} catch {
		throw new CustomError('Invalid Google token', EStatusCodes.UNAUTHORIZED)
	}

	if (!payload || !payload.sub || !payload.email) {
		throw new CustomError('Invalid Google token payload', EStatusCodes.UNAUTHORIZED)
	}

	const googleId = payload.sub
	const email = payload.email
	const fullName = payload.name || 'Google User'

	let user = await getUserByGoogleId({ googleId })

	if (!user) {
		const existingUser = await getUserByEmail({ email })

		if (existingUser) {
			// Link Google account to existing user
			user = await updateUserById({
				id: existingUser.id,
				updates: { googleId }
			})
		} else {
			// Create new user with random password hash
			const randomPassword = crypto.randomUUID()
			const passwordHash = bcrypt.hashSync(randomPassword, Number(globalConfig.hashSalt))

			user = await createUser({
				email,
				fullName,
				phone: '',
				age: 0,
				passwordHash,
				googleId
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

export async function authenticateUser(input: TLoginInput): Promise<ILoginResponse> {
	const user = await getUserByEmail({ email: input.email })

	if (!user) throw new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)

	const isValidPassword = bcrypt.compareSync(input.password, user.passwordHash)

	if (!isValidPassword) throw new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)

	const { accessToken, refreshToken } = generateTokens({ userId: user.id })

	await updateUserById({ id: user.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken
	}
}

export async function registerUser({ password, ...input }: TSignupInput): Promise<IUserProfile> {
	const passwordHash = bcrypt.hashSync(password, Number(HASH_SALT) ?? '')

	const user = await createUser({ ...input, passwordHash })

	return removeUserSensitive({ user })
}

export async function refreshAccessToken(input: TRefreshTokenInput): Promise<IRefreshTokenResponse> {
	verifyJwtToken({ token: input.refreshToken })

	const user = await getUserByRefreshToken({ refreshToken: input.refreshToken })

	if (!user) {
		throw new CustomError('Invalid refresh token', EStatusCodes.UNAUTHORIZED)
	}

	const { accessToken, refreshToken } = generateTokens({ userId: user.id })

	await updateUserById({ id: user.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken: refreshToken
	}
}

export async function revokeUserRefreshToken(userId: string): Promise<void> {
	await updateUserById({ id: userId, updates: { refreshToken: undefined } })
}