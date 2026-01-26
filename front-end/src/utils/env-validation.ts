import { z } from 'zod'

export const frontendEnvSchema = z.object({
    VITE_API_BASE: z.url('VITE_API_BASE must be a valid URL').default('http://localhost:3000/trpc'),
    MODE: z.enum(['development', 'production', 'test']).default('development'),
})

export type FrontendEnv = z.infer<typeof frontendEnvSchema>