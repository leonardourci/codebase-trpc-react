import { getUserById, updateUserById } from "../database/repositories/user.repository";
import { User, UserProfile, UpdateUserInput } from "../types/user";

export const removeUserSensitive = ({ user }: { user: User }): UserProfile => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    age: user.age,
    phone: user.phone,
    emailVerified: user.emailVerified,
})

export async function getUserProfile({ userId }: { userId: User['id'] }): Promise<UserProfile | null> {
    const user = await getUserById({ id: userId });

    if (!user) {
        return null
    }

    return removeUserSensitive({ user })
}

export async function updateUserProfile({ userId, updates }: { userId: User['id'], updates: UpdateUserInput }): Promise<UserProfile | null> {
    const user = await updateUserById({ id: userId, updates });

    if (!user) {
        return null
    }

    return removeUserSensitive({ user })
}
