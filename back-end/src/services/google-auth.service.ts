import { OAuth2Client } from 'google-auth-library'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

import globalConfig from '../utils/global-config'
import { generateJwtToken } from '../utils/jwt'
import { CustomError } from '../utils/errors'
import { EStatusCodes } from '../utils/status-codes'
import {
	createUser,
	getUserByEmail,
	getUserByGoogleId,
	updateUserById
} from '../database/repositories/user.repository'
import { ILoginResponse } from '../types/auth'

const client = new OAuth2Client(globalConfig.googleClientId)

export interface IGoogleAuthInput {
	credential: string
}

export async function authenticateWithGoogle(input: IGoogleAuthInput): Promise<ILoginResponse> {
	const { credential } = input

	// Verify the Google token
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

	// Check if user exists by Google ID
	let user = await getUserByGoogleId({ googleId })

	if (!user) {
		// Check if user exists by email (for account linking)
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

	// Generate tokens
	const accessToken = generateJwtToken({ userId: user.id })
	const refreshToken = accessToken

	await updateUserById({ id: user.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken
	}
}