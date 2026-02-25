import { z } from 'zod'

export const loginSchema = z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
})

export const signupBaseSchema = z.object({
    fullName: z.string().min(3, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().min(1, 'Password is required'),
    age: z.number().int('Age must be an integer').positive('Age must be positive')
})

export const signupSchema = signupBaseSchema.extend({
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type TSignUpFormInput = z.infer<typeof signupSchema>
export type SignupInput = z.infer<typeof signupBaseSchema>

export type LoginFormData = LoginInput
export type SignupFormData = TSignUpFormInput
export type SignupBaseData = SignupInput