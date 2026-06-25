import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  logger.info(`${req.method} ${req.path}`)
  next()
}