import { Request, Response, NextFunction } from 'express'
import { ZodType } from 'zod'
import { AppError } from './error.middleware'

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = result.error.issues.map(e => e.message).join(', ')
      return next(new AppError(message, 422))
    }
    req.body = result.data
    next()
  }
}