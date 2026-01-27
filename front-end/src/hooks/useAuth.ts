import { useState, useEffect } from 'react'
import { authService, type IAuthResponse } from '../services/auth.service'
import { getUser, isAuthenticated } from '../utils/auth'
import { IUserProfile } from '@/types'
import { TLoginInput, TSignupInput } from '@/validations'

export interface AuthState {
    user: IUserProfile | null
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
    }, [])

    const login = async (credentials: TLoginInput): Promise<IAuthResponse> => {
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

    const signup = async (userData: TSignupInput): Promise<IAuthResponse> => {
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

    return {
        ...authState,
        login,
        googleLogin,
        signup,
        logout,
        refreshTokens,
    }
}