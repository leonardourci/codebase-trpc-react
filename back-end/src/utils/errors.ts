import { ZodError } from 'zod'

import { StatusCodes } from './status-codes'

export class CustomError extends Error {
    statusCode: StatusCodes

    constructor(message: string, statusCode: StatusCodes) {
        super(message)
        this.statusCode = statusCode
    }
}

export class ZodValidationError extends CustomError {
    public messages: Array<string>

    constructor(error: ZodError) {
        super('Validation failed', StatusCodes.UNPROCESSABLE)
        this.messages = error.issues.map((issue) => `${issue.path}: ${issue.message}`)
    }
}
