import { trpcClient } from '../lib/trpc'
import type { TUpdateUserInput } from '@/types'

export class UserService {
    async getProfile() {
        return await trpcClient.user.getUserById.query()
    }

    async updateProfile(updates: TUpdateUserInput) {
        return await trpcClient.user.updateUserById.mutate(updates)
    }

    async requestEmailChange(newEmail: string) {
        return await trpcClient.user.requestEmailChange.mutate({ newEmail })
    }

    async verifyEmailChange(code: string) {
        return await trpcClient.user.verifyEmailChange.mutate({ code })
    }
}

export const userService = new UserService()