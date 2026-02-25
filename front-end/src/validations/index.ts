export * from './auth.schemas'
export * from './user.schemas'
export * from './product.schemas'
export * from './common.schemas'

export {
    loginSchema,
    signupSchema,
    signupBaseSchema,
    type LoginInput,
    type TSignUpFormInput,
    type SignupInput,
    // Legacy aliases
    type LoginFormData,
    type SignupFormData,
    type SignupBaseData
} from './auth.schemas'

export {
    updateUserSchema,
    type UpdateUserFormData
} from './user.schemas'

export {
    createProductSchema,
    updateProductSchema,
    productFilterSchema,
    type CreateProductData,
    type UpdateProductData,
    type ProductFilterData
} from './product.schemas'

export {
    createPasswordConfirmationSchema,
    requiredString,
    optionalString,
    requiredNumber,
    optionalNumber,
    urlSchema,
    dateSchema
} from './common.schemas'