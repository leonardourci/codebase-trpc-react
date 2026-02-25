import { trpcClient } from '../lib/trpc'
import type { UpdateUserInput } from '@/lib/trpc-types'

export class UserService {
    async getProfile() {
        return await trpcClient.user.getUserById.query()
    }

    async updateProfile(updates: UpdateUserInput) {
        return await trpcClient.user.updateUserById.mutate(updates)
    }
}

export const userService = new UserService()