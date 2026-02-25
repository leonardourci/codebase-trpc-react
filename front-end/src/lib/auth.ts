import { trpcClient } from './trpc'
import {
    setTokens,
    setUser,
    clearAuthData,
    getRefreshToken,
    hasValidAccessToken,
    getUser,
} from '../utils/auth'
import type { LoginInput, SignupInput, LoginResponse, UserProfile } from '@/lib/trpc-types'

export interface IAuthResponse {
    user: UserProfile
    accessToken: string
    refreshToken: string
}

export class AuthService {
    private refreshPromise: Promise<void> | null = null

    async login(credentials: LoginInput): Promise<IAuthResponse> {
        const response: LoginResponse = await trpcClient.auth.login.mutate(credentials)

        setTokens(response.accessToken, response.refreshToken)

        const user = await trpcClient.user.getUserById.query()

        if (!user) {
            throw new Error('User not found')
        }

        setUser(user)

        return {
            user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken
        }
    }

    async googleLogin(credential: string): Promise<IAuthResponse> {
        const response: LoginResponse = await trpcClient.auth.google.mutate({ credential })

        setTokens(response.accessToken, response.refreshToken)

        const user = await trpcClient.user.getUserById.query()

        if (!user) {
            throw new Error('User not found')
        }

        setUser(user)

        return {
            user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken
        }
    }

    async signup(userData: SignupInput): Promise<IAuthResponse> {
        await trpcClient.auth.signup.mutate(userData)

        // For signup, we need to login to get tokens since signup doesn't return them
        const loginResponse = await this.login({
            email: userData.email,
            password: userData.password
        })

        return loginResponse
    }

    async refreshTokens(): Promise<void> {
        // Prevent multiple simultaneous refresh attempts
        if (this.refreshPromise) {
            return this.refreshPromise
        }

        this.refreshPromise = this.performRefresh()
        return this.refreshPromise
    }

    private async performRefresh(): Promise<void> {
        try {
            const refreshToken = getRefreshToken()
            if (!refreshToken) {
                throw new Error('No refresh token available')
            }

            const response = await trpcClient.auth.refresh.mutate({ refreshToken })

            setTokens(response.accessToken, response.refreshToken)

        } catch (error) {
            this.logout()
            throw error
        } finally {
            this.refreshPromise = null
        }
    }

    async logout(): Promise<void> {
        try {
            if (hasValidAccessToken()) {
                await trpcClient.auth.logout.mutate()
            }
        } catch (error) {
            console.warn('Logout request failed:', error)
        } finally {
            clearAuthData()
        }
    }

    getCurrentUser(): UserProfile | null {
        return getUser()
    }

    isAuthenticated(): boolean {
        return hasValidAccessToken()
    }
}

export const authService = new AuthService()
