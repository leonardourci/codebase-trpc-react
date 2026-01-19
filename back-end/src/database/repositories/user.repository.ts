import knex from '../knex'
import { ISignupResponse } from '../../types/auth'
import { User } from '../models/User.model'
import { ICreateUserPayload, IUserInfoByEmailResponse } from '../../types/user'

export async function createUser(payload: ICreateUserPayload): Promise<ISignupResponse> {
	const [row] = await knex(User.tableName)
		.insert({
			email: payload.email,
			full_name: payload.fullName,
			age: payload.age,
			phone: payload.phone,
			password_hash: payload.passwordHash,
			created_at: new Date(),
			updated_at: new Date()
		})
		.returning(['id', 'email', 'full_name', 'age', 'password_hash'])

	return new User({
		email: row.email,
		fullName: row.full_name,
		phone: row.phone,
		passwordHash: row.password_hash,
		age: row.age
	}).toSignupResponse()
}

export const getUserByEmail = async (payload: Pick<User, 'email'>): Promise<IUserInfoByEmailResponse | null> => {
	const [row] = await knex(User.tableName).where({ email: payload.email }).select()

	if (!row) return null

	const user = new User(row).toUserInfoByEmailResponse()

	return user
}

export const getUserById = async (payload: { id: string }): Promise<User | null> => {
	const [row] = await knex(User.tableName).where({ id: payload.id }).select()

	if (!row) return null

	return new User(row).toJSON()
}
