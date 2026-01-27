import { ZodError } from 'zod'

import { EStatusCodes } from './status-codes'

export class CustomError extends Error {
    statusCode: EStatusCodes

    constructor(message: string, statusCode: EStatusCodes) {
        super(message)
        this.statusCode = statusCode
    }
}

export class ZodValidationError extends CustomError {
    public messages: Array<string>

    constructor(error: ZodError) {
        super('Validation failed', EStatusCodes.UNPROCESSABLE)
        this.messages = error.issues.map((issue) => `${issue.path}: ${issue.message}`)
    }
}
