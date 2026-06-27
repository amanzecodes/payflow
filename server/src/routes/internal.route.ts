import { Router, Request, Response, NextFunction } from 'express'
import { openCycles } from '../jobs/cycle.job'
import { markOverdueCharges } from '../jobs/overdue.job'
import { env } from '../config/env'
import { AppError } from '../middleware/error.middleware'

const router = Router()

function devOnly(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'production') {
    next(new AppError('Not available in production', 403))
    return
  }
  next()
}

router.post(
  '/open-cycles',
  devOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await openCycles()
      res.json({ success: true, message: 'Cycles opened successfully' })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/mark-overdue',
  devOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await markOverdueCharges()
      res.json({ success: true, message: 'Overdue charges marked successfully' })
    } catch (error) {
      next(error)
    }
  }
)

export default router