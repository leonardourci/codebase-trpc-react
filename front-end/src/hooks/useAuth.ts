import { useState, useEffect } from 'react'
import { authService, type IAuthResponse } from '../lib/auth'
import { getUser, isAuthenticated, AUTH_STATE_CHANGE_EVENT, setUser, getAccessToken } from '../utils/auth'
import { UserProfile } from '@/lib/trpc-types'
import { LoginInput, SignupInput } from '@/validations'
import { globalConfig } from '@/utils/global-config'

export interface AuthState {
    user: UserProfile | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    })

    useEffect(() => {
        const initializeAuth = () => {
            const user = getUser()
            const authenticated = isAuthenticated()

            setAuthState({
                user,
                isAuthenticated: authenticated,
                isLoading: false,
                error: null,
            })
        }

        initializeAuth()

        // Listen for auth state changes (e.g., when tokens are cleared from trpc.ts)
        const handleAuthStateChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ authenticated: boolean }>
            if (!customEvent.detail.authenticated) {
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: 'Session expired',
                })
            }
        }

        window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange)
        return () => {
            window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange)
        }
    }, [])

    const login = async (credentials: LoginInput): Promise<IAuthResponse> => {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            const response = await authService.login(credentials)
            setAuthState({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            })
            return response
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed'
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }))
            throw error
        }
    }

    const googleLogin = async (credential: string): Promise<IAuthResponse> => {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            const response = await authService.googleLogin(credential)
            setAuthState({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            })
            return response
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Google login failed'
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }))
            throw error
        }
    }

    const signup = async (userData: SignupInput): Promise<IAuthResponse> => {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            const response = await authService.signup(userData)
            setAuthState({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            })
            return response
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Signup failed'
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }))
            throw error
        }
    }

    const logout = async () => {
        setAuthState(prev => ({ ...prev, isLoading: true }))

        try {
            await authService.logout()
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            })
        } catch {
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            })
        }
    }

    const refreshTokens = async () => {
        try {
            await authService.refreshTokens()
            const user = getUser()
            setAuthState(prev => ({
                ...prev,
                user,
                isAuthenticated: true,
            }))
        } catch (error) {
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Session expired',
            })
            throw error
        }
    }

    /**
     * Refreshes user data from the backend to sync with the database.
     *
     * This is critical for security when:
     * 1. User manipulates localStorage (e.g., setting emailVerified: true)
     * 2. Backend rejects the request (e.g., 403 error for unverified email)
     * 3. We need to re-sync frontend state with the actual backend/database state
     *
     * This ensures the frontend always displays the correct user state and prevents
     * users from bypassing validations by manipulating client-side data.
     */
    const refreshUser = async () => {
        try {
            const token = getAccessToken()
            if (!token) {
                throw new Error('No access token available')
            }

            // Fetch fresh user data from the database via the user.getUserById endpoint
            const response = await fetch(`${globalConfig.apiBase}/user.getUserById`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch user data')
            }

            const data = await response.json()
            const freshUser: UserProfile = data.result.data

            // Update both localStorage and React state with fresh data from the database
            setUser(freshUser)
            setAuthState(prev => ({
                ...prev,
                user: freshUser,
            }))

            return freshUser
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user data'
            setAuthState(prev => ({
                ...prev,
                error: errorMessage,
            }))
            throw error
        }
    }

    return {
        ...authState,
        login,
        googleLogin,
        signup,
        logout,
        refreshTokens,
        refreshUser,
    }
}