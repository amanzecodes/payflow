import { Request, Response, NextFunction } from 'express'
import { WebhookService } from '../services/webhook.service'
import { paymentProvider } from '../providers'
import { AppError } from '../middleware/error.middleware'
import { env } from '../config/env'

export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  async handleNomba(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // verify signature
      const isValid = paymentProvider.verifyWebhookSignature(req.body, req.headers as any)
      if (!isValid) throw new AppError('Invalid webhook signature', 403)

      // acknowledge immediately
      res.status(200).json({ received: true })

      // process asynchronously
      await this.webhookService.processNombaWebhook(req.body)
    } catch (error) {
      next(error)
    }
  }

  async handleTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (env.PROVIDER !== 'mock') {
        throw new AppError('Test endpoint only available in mock mode', 403)
      }

      const { accountRef, amount } = req.body
      if (!accountRef || !amount) {
        throw new AppError('accountRef and amount are required', 400)
      }

      await this.webhookService.processTestWebhook(accountRef, amount)
      res.status(200).json({ success: true, message: 'Test payment processed' })
    } catch (error) {
      next(error)
    }
  }
}