import { updateUserById, getUserById } from '../database/repositories/user.repository'
import type { IUser, IUserProfile, TUpdateUserInput } from '../types/user'

export const removeUserSensitive = ({ user }: { user: IUser }): IUserProfile => {
	return {
		id: user.id,
		email: user.email,
		fullName: user.fullName,
		age: user.age,
		phone: user.phone,
		emailVerified: user.emailVerified
	}
}

export async function getUserProfile({ userId }: { userId: IUser['id'] }): Promise<IUserProfile | null> {
	const user = await getUserById({ id: userId })

	if (!user) {
		return null
	}

	return removeUserSensitive({ user })
}

export async function updateUserProfile({ userId, updates }: { userId: IUser['id']; updates: TUpdateUserInput }): Promise<IUserProfile | null> {
	const user = await updateUserById({ id: userId, updates })

	if (!user) {
		return null
	}

	return removeUserSensitive({ user })
}
