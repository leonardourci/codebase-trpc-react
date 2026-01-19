import { IBaseModel } from "../database/models/Base.model"

export interface IUser extends IBaseModel {
  email: string
  fullName: string
  phone: string
  age: number
  passwordHash?: string
}

export interface ICreateUserPayload {
  fullName: string
  email: string
  passwordHash: string
  age: number
  phone: string
}

export interface IUserInfoByEmailResponse {
  id: string
  passwordHash: string
}