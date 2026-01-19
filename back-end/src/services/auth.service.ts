import bcrypt from 'bcrypt'

import { generateJwtToken } from '../utils/jwt'
import { CustomError } from '../utils/errors'
import { EStatusCodes } from '../utils/statusCodes'
import { ILoginPayload, ILoginResponse, ISignupPayload, ISignupResponse } from '../types/auth'
import { createUser, getUserByEmail } from '../database/repositories/user.repository'

const { HASH_SALT } = process.env

export async function authenticateUser(payload: ILoginPayload): Promise<ILoginResponse> {
	const userInfo = await getUserByEmail({ email: payload.email })

	if (!userInfo) throw new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)

	const isValidPassword = bcrypt.compareSync(payload.password, userInfo.passwordHash)

	if (!isValidPassword) throw new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)

	return { token: generateJwtToken({ userId: userInfo.id }) }
}

export async function registerUser(payload: ISignupPayload): Promise<ISignupResponse> {
	const passwordHash = bcrypt.hashSync(payload.password, Number(HASH_SALT) ?? '')

	return await createUser({ ...payload, passwordHash })
}
