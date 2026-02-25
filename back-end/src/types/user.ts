import z from "zod"

import { BaseModel } from "./base"
import { updateUserSchema } from "../utils/validations/user.schemas"

export interface User extends BaseModel {
  email: string
  fullName: string
  phone: string
  age: number
  passwordHash: string
  refreshToken: string | null
  googleId: string | null
  emailVerified: boolean
  emailVerificationToken: string | null
  currentProductId: string | null
}

export interface UserProfile extends Pick<User, 'id' | 'age' | 'email' | 'fullName' | 'phone' | 'emailVerified'> { }

export interface CreateUserInput {
  fullName: string
  email: string
  passwordHash: string
  age: number
  phone: string
  googleId?: string
  emailVerified?: boolean
  emailVerificationToken?: string
  currentProductId?: string
}

export enum UserDbRowKeys {
  id = 'id',
  email = 'email',
  fullName = 'full_name',
  phone = 'phone',
  age = 'age',
  passwordHash = 'password_hash',
  refreshToken = 'refresh_token',
  googleId = 'google_id',
  emailVerified = 'email_verified',
  emailVerificationToken = 'email_verification_token',
  currentProductId = 'current_product_id',
  createdAt = 'created_at',
  updatedAt = 'updated_at'
}

export interface UserDbRow {
  id: string
  email: string
  full_name: string
  phone: string
  age: number
  password_hash: string
  refresh_token: string | null
  google_id: string | null
  email_verified: boolean
  email_verification_token: string | null
  current_product_id: string | null
  created_at: Date
  updated_at: Date | null
}

export interface UserInfoByEmailResponse {
  id: string
  email: string
  fullName: string
  passwordHash: string
  googleId?: string
  emailVerified: boolean
}

export type UpdateUserInput = z.infer<typeof updateUserSchema>