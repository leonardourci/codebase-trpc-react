import type { UserProfile } from '@/lib/trpc-types'
import { STORAGE_KEYS } from '@/constants'

const ACCESS_TOKEN_KEY = STORAGE_KEYS.ACCESS_TOKEN
const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN
const USER_KEY = STORAGE_KEYS.USER

export interface IAuthTokens {
    accessToken: string
    refreshToken: string
}

export const setAccessToken = (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const getAccessToken = (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setRefreshToken = (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setUser = (user: UserProfile): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = (): UserProfile | null => {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
}

export const setTokens = (accessToken: string, refreshToken: string): void => {
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)
}

export const AUTH_STATE_CHANGE_EVENT = 'auth-state-change'

export const clearAuthData = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    // Dispatch event so React components can react to auth state changes
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT, { detail: { authenticated: false } }))
}

export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        return payload.exp < currentTime
    } catch {
        return true
    }
}

export const hasValidAccessToken = (): boolean => {
    const token = getAccessToken()
    return token !== null && !isTokenExpired(token)
}

export const hasRefreshToken = (): boolean => {
    return getRefreshToken() !== null
}

export const isAuthenticated = (): boolean => {
    return hasValidAccessToken() || hasRefreshToken()
}