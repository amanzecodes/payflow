import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { PayoutService } from '../services/payout.service'

const requestPayoutSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
})

export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  async requestPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount } = requestPayoutSchema.parse(req.body)
      const payout = await this.payoutService.requestPayout(req.params.orgId as string, amount)
      res.status(201).json({ success: true, data: payout })
    } catch (error) {
      next(error)
    }
  }

  async getAllByOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payouts = await this.payoutService.getAllByOrg(req.params.orgId as string)
      res.status(200).json({ success: true, data: payouts })
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payout = await this.payoutService.getById(req.params.payoutId as string)
      res.status(200).json({ success: true, data: payout })
    } catch (error) {
      next(error)
    }
  }

  async getPayoutPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.payoutService.getPayoutPage(req.params.orgId as string)
      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
}