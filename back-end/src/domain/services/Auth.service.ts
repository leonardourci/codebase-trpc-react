import bcrypt from 'bcrypt'

import { generateJwtToken } from '../../utils/jwt'
import { CustomError } from '../../utils/errors'
import { EStatusCodes } from '../statusCodes'
import { ILoginPayload, ILoginResponse, ISignupPayload, ISignupResponse } from '../../interfaces/auth'
import { createUser, selectUserByEmail } from '../../repositories/User.repository'

const { HASH_SALT } = process.env

export async function authenticateUser(payload: ILoginPayload): Promise<ILoginResponse> {
	const userInfo = await selectUserByEmail(payload.email)

	const isValidPassword = bcrypt.compareSync(payload.password, userInfo.passwordHash)

	if (!isValidPassword) throw new CustomError('Username or password is wrong', EStatusCodes.UNAUTHORIZED)

	return { token: generateJwtToken({ userId: userInfo.id }) }
}

export async function registerUser(payload: ISignupPayload): Promise<ISignupResponse> {
	const passwordHash = bcrypt.hashSync(payload.password, Number(HASH_SALT) ?? '')

	return await createUser({ ...payload, password: passwordHash })
}
