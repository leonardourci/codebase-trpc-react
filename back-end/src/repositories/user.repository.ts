import { ISignupPayload, ISignupResponse } from '../interfaces/auth'
import { IUserInfoByEmailResponse } from '../interfaces/user'

/**
 * @todo
 * - criar adapters pra resposta do banco e transformar de snake_case pra camelCase
 */

export async function selectUserByEmail(email: string): Promise<IUserInfoByEmailResponse> {
	return {
		id: 1,
		passwordHash: '$2b$10$b1vft0gkw/3pBsh6HGqdtOEMW5OVqi919Awm2wpabVK4xwsgbS3my' // senhateste
	}
}

export async function createUser(payload: ISignupPayload): Promise<ISignupResponse> {
	return {
		id: 1,
		age: payload.age,
		email: payload.email,
		fullName: payload.fullName
	}
}
