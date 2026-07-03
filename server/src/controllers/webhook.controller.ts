import { Request, Response } from 'express'
import { WebhookService } from '../services/webhook.service'
import { paymentProvider } from '../providers'
import { logger } from '../lib/logger'
import { NombaWebhookPayload } from '../providers/PaymentProviders'

export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  async handleNomba(req: Request, res: Response): Promise<void> {
    try {
      const isValid = paymentProvider.verifyWebhookSignature(
        req.headers as Record<string, string>,
        req.rawBody || ''
      )

      if (!isValid) {
        logger.warn('[WebhookController] Invalid signature — rejecting')
        res.status(403).json({ success: false, error: 'Invalid webhook signature' })
        return
      }

      await this.webhookService.processNombaWebhook(
        req.body as NombaWebhookPayload
      )

      res.status(200).json({ received: true })

    } catch (error) {
      logger.error(`[WebhookController] Webhook processing failed: ${error}`)
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Processing failed' })
      }
    }
  }
}