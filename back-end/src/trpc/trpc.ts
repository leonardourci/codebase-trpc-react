import { initTRPC, TRPCError } from '@trpc/server'
import { Request, Response } from 'express'
import { IUser } from '../types/user'
import { CustomError, ZodValidationError } from '../utils/errors'
import { EStatusCodes } from '../utils/status-codes'

type TRPCErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_SUPPORTED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNPROCESSABLE_CONTENT'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST'
  | 'INTERNAL_SERVER_ERROR'

const ERROR_STATUS_CODE_TO_TRPC_CODE: Record<number, TRPCErrorCode> = {
  [EStatusCodes.UNAUTHORIZED]: 'UNAUTHORIZED',
  [EStatusCodes.NOT_FOUND]: 'NOT_FOUND',
  [EStatusCodes.NOT_ACCEPTABLE]: 'BAD_REQUEST',
  [EStatusCodes.CONFLICT]: 'CONFLICT',
  [EStatusCodes.PRECONDITION_FAILED]: 'PRECONDITION_FAILED',
  [EStatusCodes.UNPROCESSABLE]: 'UNPROCESSABLE_CONTENT',
  [EStatusCodes.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR'
}

const mapStatusCodeToTRPCCode = (statusCode: number): TRPCErrorCode => {
  return ERROR_STATUS_CODE_TO_TRPC_CODE[statusCode] || 'INTERNAL_SERVER_ERROR'
}

export const transformErrorToTRPC = (error: unknown): TRPCError => {
  if (error instanceof ZodValidationError) {
    return new TRPCError({
      code: mapStatusCodeToTRPCCode(error.statusCode),
      message: error.message,
      cause: {
        messages: error.messages,
        statusCode: error.statusCode
      }
    })
  }

  if (error instanceof CustomError) {
    return new TRPCError({
      code: mapStatusCodeToTRPCCode(error.statusCode),
      message: error.message,
      cause: {
        statusCode: error.statusCode
      }
    })
  }

  if (error instanceof Error) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message
    })
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  })
}
export interface ITRPCContext {
  user?: IUser
  req: Request
  res: Response
}

export const createTRPCContext = (opts: { req: Request; res: Response }): ITRPCContext => {
  return {
    req: opts.req,
    res: opts.res,
    // user will be populated by authentication middleware
  }
}

// Initialize tRPC instance
const t = initTRPC.context<ITRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Preserve custom error details for framework-agnostic error handling
        details: error.cause || undefined
      }
    }
  }
})

// Export tRPC utilities
export const router = t.router
export const procedure = t.procedure
export const middleware = t.middleware

// Export the tRPC instance for advanced usage
export { t }