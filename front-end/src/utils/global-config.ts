import { frontendEnvSchema } from '@/utils/env-validation'
import z from 'zod'

const envValidation = frontendEnvSchema.safeParse({
    VITE_API_BASE: import.meta.env.VITE_API_BASE,
    MODE: import.meta.env.MODE,
})

if (!envValidation.success) {
    console.error('❌ Invalid environment variables:', z.treeifyError(envValidation.error))
    throw new Error('Invalid environment configuration')
}

const env = envValidation.data

export const globalConfig = {
    apiBase: env.VITE_API_BASE,

    environment: env.MODE,
    isDevelopment: env.MODE === 'development',
    isProduction: env.MODE === 'production',
    isTest: env.MODE === 'test',

    features: {
        enableDevTools: env.MODE === 'development',
        enableAnalytics: env.MODE === 'production',
    },

    app: {
        name: 'Frontend App',
        version: '1.0.0',
    },
} as const

export type GlobalConfig = typeof globalConfig
