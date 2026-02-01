import knex from '../knex'
import { ICreateUserInput, IUserInfoByEmailResponse, IUser, IUserDbRow, EUserDbRowKeys } from '../../types/user'
import { keysToCamelCase, keysToSnakeCase } from '../../utils/case-conversion'

const USERS_TABLE = 'users'

export async function createUser(input: ICreateUserInput): Promise<IUser> {
	const insertData = keysToSnakeCase<ICreateUserInput, Partial<IUserDbRow>>(input)

	const [row] = await knex(USERS_TABLE)
		.insert(insertData)
		.returning(Object.values(EUserDbRowKeys))

	return keysToCamelCase<IUserDbRow, IUser>(row)
}

export const getUserByEmail = async (input: { email: string }): Promise<IUserInfoByEmailResponse | null> => {
	const [row] = await knex(USERS_TABLE).where({ email: input.email }).select()

	if (!row) return null

	return {
		id: row[EUserDbRowKeys.id],
		email: row[EUserDbRowKeys.email],
		fullName: row[EUserDbRowKeys.fullName],
		passwordHash: row[EUserDbRowKeys.passwordHash],
		googleId: row[EUserDbRowKeys.googleId],
		emailVerified: row[EUserDbRowKeys.emailVerified]
	}
}

export const getUserByGoogleId = async (input: { googleId: IUser['googleId'] }): Promise<IUser | null> => {
	const [row] = await knex(USERS_TABLE).where({ google_id: input.googleId }).select()

	if (!row) return null

	return keysToCamelCase<IUserDbRow, IUser>(row)
}

export const getUserById = async (input: { id: string }): Promise<IUser | null> => {
	const [row] = await knex(USERS_TABLE).where({ id: input.id }).select()

	if (!row) return null

	return keysToCamelCase<IUserDbRow, IUser>(row)
}

export const getUserByRefreshToken = async ({ refreshToken }: { refreshToken: string }): Promise<IUser | null> => {
	const [row] = await knex(USERS_TABLE)
		.where({ refresh_token: refreshToken })
		.select()

	if (!row) return null

	return keysToCamelCase<IUserDbRow, IUser>(row)
}

export const getUserByEmailVerificationToken = async ({ token }: { token: string }): Promise<IUser | null> => {
	const [row] = await knex(USERS_TABLE)
		.where({ email_verification_token: token })
		.select()

	if (!row) return null

	return keysToCamelCase<IUserDbRow, IUser>(row)
}

export const updateUserById = async ({ id: userId, updates }: {
	id: string,
	updates: Partial<Pick<IUser, 'email' | 'fullName' | 'phone' | 'age' | 'passwordHash' | 'refreshToken' | 'googleId' | 'emailVerified' | 'emailVerificationToken' | 'currentProductId'>>
}
): Promise<IUser> => {
	const updateData = keysToSnakeCase<typeof updates & { updatedAt: Date }, Partial<IUserDbRow>>({
		...updates,
		updatedAt: new Date()
	})

	const [row] = await knex(USERS_TABLE)
		.where({ id: userId })
		.update(updateData)
		.returning(Object.values(EUserDbRowKeys))

	return keysToCamelCase<IUserDbRow, IUser>(row)
}