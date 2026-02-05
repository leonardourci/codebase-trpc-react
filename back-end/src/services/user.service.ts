import { updateUserById, getUserById } from '../database/repositories/user.repository'
import { getProductById } from '../database/repositories/product.repository'
import type { IUser, IUserProfile, TUpdateUserInput } from '../types/user'
import type { IProduct } from '../types/product'

export const removeUserSensitive = ({ user, product }: { user: IUser; product: IProduct | null }): IUserProfile => {
	return {
		id: user.id,
		email: user.email,
		fullName: user.fullName,
		age: user.age,
		phone: user.phone,
		emailVerified: user.emailVerified,
		externalPriceId: product?.externalPriceId ?? null
	}
}

export async function getUserProfile({ userId }: { userId: IUser['id'] }): Promise<IUserProfile | null> {
	const user = await getUserById({ id: userId })

	if (!user) {
		return null
	}

	const product = user.productId ? await getProductById({ id: user.productId }) : null

	return removeUserSensitive({ user, product })
}

export async function updateUserProfile({ userId, updates }: { userId: IUser['id']; updates: TUpdateUserInput }): Promise<IUserProfile | null> {
	const user = await updateUserById({ id: userId, updates })

	if (!user) {
		return null
	}

	const product = user.productId ? await getProductById({ id: user.productId }) : null

	return removeUserSensitive({ user, product })
}
