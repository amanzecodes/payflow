import { Request, Response, NextFunction } from 'express'
import { validateRequest } from 'twilio'
import { env } from '../config/env'
import { WhatsAppService } from '../services/whatsapp.service'
import { emptyTwimlResponse } from '../lib/twilio'
import { logger } from '../lib/logger'
import { TwilioWebhookPayload } from '../types/whatsapp'

const whatsappService = new WhatsAppService()

export class WhatsAppController {
  async handleIncoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as TwilioWebhookPayload

      // validate Twilio signature
      // use x-forwarded-proto for Railway/proxy environments
      const protocol = req.headers['x-forwarded-proto'] || req.protocol
      const fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`

      const twilioSignature = req.headers['x-twilio-signature'] as string

      const isValid = validateRequest(
        env.TWILIO_AUTH_TOKEN!,
        twilioSignature,
        fullUrl,
        req.body
      )

      // skip validation in development for easier testing
      if (env.NODE_ENV === 'production' && !isValid) {
        logger.warn(`[WhatsApp] Invalid Twilio signature from ${req.ip}`)
        res.status(403).send('Forbidden')
        return
      }

      const from = payload.From
      const body = payload.Body

      if (!from || !body) {
        // acknowledge empty messages silently
        res.type('text/xml').send(emptyTwimlResponse())
        return
      }

      // respond immediately — process is async
      // but since we need to send TwiML back we process synchronously
      // Twilio requires response within 15 seconds
      const twimlReply = await whatsappService.handleIncomingMessage(from, body)

      res.type('text/xml').send(twimlReply)

    } catch (error) {
      logger.error(`[WhatsApp] Controller error: ${error}`)
      // always return valid TwiML even on error
      res.type('text/xml').send(emptyTwimlResponse())
    }
  }
}