import z from 'zod'

import { IBaseModel } from './base'
import { updateUserSchema } from '../utils/validations/user.schemas'
import { IProduct } from './product'

export interface IUser extends IBaseModel {
	email: string
	fullName: string
	phone: string
	age: number
	passwordHash: string
	refreshToken: string | null
	googleId: string | null
	emailVerified: boolean
	emailVerificationToken: string | null
	productId: string
}

export interface IUserProfile extends Pick<IUser, 'id' | 'age' | 'email' | 'fullName' | 'phone' | 'emailVerified'> {
	currentProduct: IProduct
}

export interface ICreateUserInput {
	fullName: string
	email: string
	passwordHash: string
	age: number
	phone: string
	googleId?: string
	emailVerified?: boolean
	emailVerificationToken?: string
	productId?: string
}

export enum EUserDbRowKeys {
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
	productId = 'product_id',
	createdAt = 'created_at',
	updatedAt = 'updated_at'
}

export interface IUserDbRow {
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
	product_id: string | null
	created_at: Date
	updated_at: Date | null
}

export interface IUserInfoByEmailResponse {
	id: string
	email: string
	fullName: string
	passwordHash: string
	googleId?: string
	emailVerified: boolean
}

export interface IUserWithProduct extends IUser {
	product: IProduct
}

export type TUpdateUserInput = z.infer<typeof updateUserSchema>
