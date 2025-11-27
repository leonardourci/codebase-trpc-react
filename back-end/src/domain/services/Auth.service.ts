import bcrypt from 'bcrypt'

import BaseService from './BaseService'
import { generateToken } from '../../utils/jwt'
import { CustomError } from '../../utils/errors'
import { EStatusCodes } from '../statusCodes'
import { ILoginPayload, ILoginResponse, ISignupPayload, ISignupResponse } from '../../interfaces/auth'

const { HASH_SALT } = process.env

export default class AuthService extends BaseService {
	login = async (payload: ILoginPayload): Promise<ILoginResponse> => {
		const userInfo = await this.repository.user.getUserByEmail(payload.email)

		const isValidPassword = bcrypt.compareSync(payload.password, userInfo.passwordHash)

		if (!isValidPassword) throw new CustomError('Username or password is wrong', EStatusCodes.UNAUTHORIZED)

		return { token: generateToken({ userId: userInfo.id }) }
	}

	signup = async (payload: ISignupPayload): Promise<ISignupResponse> => {
		const passwordHash = bcrypt.hashSync(payload.password, Number(HASH_SALT) ?? '')

		return this.repository.user.create({ ...payload, password: passwordHash })
	}
}
