export interface IUser {
    id: string
    email: string
    fullName: string
    phone: string
    age: number
    passwordHash: string
    refreshToken: string | null
    emailVerified: boolean
    currentProductId: string | null
    createdAt: Date
    updatedAt: Date | null
}

export interface IUserProfile {
    id: string
    email: string
    fullName: string
    age: number
    phone: string
    emailVerified: boolean
}

export interface TUpdateUserInput {
    fullName?: string
    email?: string
    phone?: string
    age?: number
}