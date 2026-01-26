import bcrypt from 'bcrypt'

import { generateJwtToken, verifyJwtToken } from '../utils/jwt'
import { CustomError } from '../utils/errors'
import { EStatusCodes } from '../utils/statusCodes'
import { TLoginInput, ILoginResponse, TSignupInput } from '../types/auth'
import { TRefreshTokenInput, IRefreshTokenResponse } from '../types/refreshToken'
import {
	createUser,
	getUserByEmail,
	getUserByRefreshToken,
	updateUserById
} from '../database/repositories/user.repository'
import { removeUserSensitive } from './user.service'
import { IUserProfile } from '../types/user'

const { HASH_SALT } = process.env

export async function authenticateUser(input: TLoginInput): Promise<ILoginResponse> {
	const user = await getUserByEmail({ email: input.email })

	if (!user) throw new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)

	const isValidPassword = bcrypt.compareSync(input.password, user.passwordHash)

	if (!isValidPassword) throw new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)

	const accessToken = generateJwtToken({ userId: user.id })
	const refreshToken = accessToken

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

	const accessToken = generateJwtToken({ userId: user.id })
	const refreshToken = accessToken

	await updateUserById({ id: user.id, updates: { refreshToken } })

	return {
		accessToken,
		refreshToken: refreshToken
	}
}

export async function revokeUserRefreshToken(userId: string): Promise<void> {
	await updateUserById({ id: userId, updates: { refreshToken: undefined } })
}