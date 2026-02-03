import { updateUserById, getUserWithProductById } from '../database/repositories/user.repository'
import type { IUserWithProduct, IUser, IUserProfile, TUpdateUserInput } from '../types/user'

export const removeUserSensitive = ({ user }: { user: IUserWithProduct }): IUserProfile => ({
	id: user.id,
	email: user.email,
	fullName: user.fullName,
	age: user.age,
	phone: user.phone,
	emailVerified: user.emailVerified,
	currentProduct: user.product
})

export async function getUserProfile({ userId }: { userId: IUser['id'] }): Promise<IUserProfile | null> {
	const user = await getUserWithProductById({ id: userId })

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

	// After update, fetch with product info
	const userWithProduct = await getUserWithProductById({ id: userId })

	if (!userWithProduct) {
		return null
	}

	return removeUserSensitive({ user: userWithProduct })
}
