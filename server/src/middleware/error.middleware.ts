import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: err.issues[0]?.message ?? 'Invalid request data'
    })
    return
  }

  logger.error(`Unhandled error: ${err.message}`)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
}