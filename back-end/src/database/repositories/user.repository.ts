import knex from '../knex'
import { ISignupResponse } from '../../types/auth'
import { ICreateUserPayload, IUserInfoByEmailResponse, User } from '../models/User.model'

export async function createUser(payload: ICreateUserPayload): Promise<ISignupResponse> {
	const [row] = await knex(User.tableName)
		.insert({
			email: payload.email,
			full_name: payload.fullName,
			age: payload.age,
			phone: payload.phone,
			password_hash: payload.password,
			created_at: new Date(),
			updated_at: new Date()
		})
		.returning(['id', 'email', 'full_name', 'age'])

	return new User({
		id: row.id,
		email: row.email,
		fullName: row.full_name,
		phone: row.phone,
		age: row.age
	}).toSignupResponse()
}

export async function getUserByEmail(payload: Pick<User, 'email'>): Promise<IUserInfoByEmailResponse | null> {
	const [row] = await knex(User.tableName).where({ email: payload.email }).select()

	if (!row) return null

	const user = new User(row).toUserInfoByEmailResponse()

	return user
}
