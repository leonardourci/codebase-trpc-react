import knex from '../knex'
import { ISignupResponse } from '../../types/auth'
import { User } from '../models/User.model'
import { ICreateUserInput, IUserInfoByEmailResponse, IUser } from '../../types/user'

export async function createUser(input: ICreateUserInput): Promise<ISignupResponse> {
	const [row] = await knex(User.tableName)
		.insert({
			email: input.email,
			full_name: input.fullName,
			age: input.age,
			phone: input.phone,
			password_hash: input.passwordHash
		})
		.returning(['id', 'email', 'full_name', 'age', 'phone', 'password_hash', 'created_at', 'updated_at'])

	return new User({
		id: row.id,
		email: row.email,
		fullName: row.full_name,
		phone: row.phone,
		passwordHash: row.password_hash,
		age: row.age,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toSignupResponse()
}

export const getUserByEmail = async (input: Pick<User, 'email'>): Promise<IUserInfoByEmailResponse | null> => {
	const [row] = await knex(User.tableName).where({ email: input.email }).select()

	if (!row) return null

	const user = new User({
		id: row.id,
		email: row.email,
		fullName: row.full_name,
		phone: row.phone,
		passwordHash: row.password_hash,
		age: row.age,
		refreshToken: row.refresh_token,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toUserInfoByEmailResponse()

	return user
}

export const getUserById = async (input: { id: string }): Promise<IUser | null> => {
	const [row] = await knex(User.tableName).where({ id: input.id }).select()

	if (!row) return null

	return new User({
		id: row.id,
		email: row.email,
		fullName: row.full_name,
		phone: row.phone,
		passwordHash: row.password_hash,
		age: row.age,
		refreshToken: row.refresh_token,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toJSON()
}

export const getUserByRefreshToken = async ({ refreshToken }: { refreshToken: string }): Promise<IUser | null> => {
	const [row] = await knex(User.tableName)
		.where({ refresh_token: refreshToken })
		.select()

	if (!row) return null

	return new User({
		id: row.id,
		email: row.email,
		fullName: row.full_name,
		phone: row.phone,
		passwordHash: row.password_hash,
		age: row.age,
		refreshToken: row.refresh_token,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}).toJSON()
}

export const updateUserById = async ({ userId, updates }: {
	userId: string,
	updates: Partial<Pick<IUser, 'email' | 'fullName' | 'phone' | 'age' | 'passwordHash' | 'refreshToken'>>
}
): Promise<void> => {
	const updateData: Record<string, any> = {
		updated_at: new Date()
	}

	if (updates.email !== undefined) updateData.email = updates.email
	if (updates.fullName !== undefined) updateData.full_name = updates.fullName
	if (updates.phone !== undefined) updateData.phone = updates.phone
	if (updates.age !== undefined) updateData.age = updates.age
	if (updates.passwordHash !== undefined) updateData.password_hash = updates.passwordHash
	if (updates.refreshToken !== undefined) updateData.refresh_token = updates.refreshToken

	await knex(User.tableName)
		.where({ id: userId })
		.update(updateData)
}