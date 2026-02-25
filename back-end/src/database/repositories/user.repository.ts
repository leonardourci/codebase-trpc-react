import knex from '../knex'
import { CreateUserInput, UserInfoByEmailResponse, User, UserDbRow, UserDbRowKeys } from '../../types/user'
import { keysToCamelCase, keysToSnakeCase } from '../../utils/case-conversion'

const USERS_TABLE = 'users'

export async function createUser(input: CreateUserInput): Promise<User> {
	const insertData = keysToSnakeCase<CreateUserInput, Partial<UserDbRow>>(input)

	const [row] = await knex(USERS_TABLE)
		.insert(insertData)
		.returning(Object.values(UserDbRowKeys))

	return keysToCamelCase<UserDbRow, User>(row)
}

export const getUserByEmail = async (input: { email: string }): Promise<UserInfoByEmailResponse | null> => {
	const [row] = await knex(USERS_TABLE).where({ email: input.email }).select()

	if (!row) return null

	return {
		id: row[UserDbRowKeys.id],
		email: row[UserDbRowKeys.email],
		fullName: row[UserDbRowKeys.fullName],
		passwordHash: row[UserDbRowKeys.passwordHash],
		googleId: row[UserDbRowKeys.googleId],
		emailVerified: row[UserDbRowKeys.emailVerified]
	}
}

export const getUserByGoogleId = async (input: { googleId: User['googleId'] }): Promise<User | null> => {
	const [row] = await knex(USERS_TABLE).where({ google_id: input.googleId }).select()

	if (!row) return null

	return keysToCamelCase<UserDbRow, User>(row)
}

export const getUserById = async (input: { id: string }): Promise<User | null> => {
	const [row] = await knex(USERS_TABLE).where({ id: input.id }).select()

	if (!row) return null

	return keysToCamelCase<UserDbRow, User>(row)
}

export const getUserByRefreshToken = async ({ refreshToken }: { refreshToken: string }): Promise<User | null> => {
	const [row] = await knex(USERS_TABLE)
		.where({ refresh_token: refreshToken })
		.select()

	if (!row) return null

	return keysToCamelCase<UserDbRow, User>(row)
}

export const getUserByEmailVerificationToken = async ({ token }: { token: string }): Promise<User | null> => {
	const [row] = await knex(USERS_TABLE)
		.where({ email_verification_token: token })
		.select()

	if (!row) return null

	return keysToCamelCase<UserDbRow, User>(row)
}

export const updateUserById = async ({ id: userId, updates }: {
	id: string,
	updates: Partial<Pick<User, 'email' | 'fullName' | 'phone' | 'age' | 'passwordHash' | 'refreshToken' | 'googleId' | 'emailVerified' | 'emailVerificationToken' | 'currentProductId'>>
}
): Promise<User> => {
	const updateData = keysToSnakeCase<typeof updates & { updatedAt: Date }, Partial<UserDbRow>>({
		...updates,
		updatedAt: new Date()
	})

	const [row] = await knex(USERS_TABLE)
		.where({ id: userId })
		.update(updateData)
		.returning(Object.values(UserDbRowKeys))

	return keysToCamelCase<UserDbRow, User>(row)
}