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

     logger.info(`[WhatsApp] Body received: ${JSON.stringify(req.body)}`)
      const payload = req.body as TwilioWebhookPayload

    

      const webhookUrl = `${env.WEBHOOK_BASE_URL}/api/v1/whatsapp/incoming`


      const twilioSignature = req.headers['x-twilio-signature'] as string

      const isValid = validateRequest(
        env.TWILIO_AUTH_TOKEN!,
        twilioSignature,
        webhookUrl,
        req.body
      )

      if (env.NODE_ENV === 'production' && !isValid) {
        logger.warn(`[WhatsApp] Invalid Twilio signature from ${req.ip}`)
        res.status(403).send('Forbidden')
        return
      }

      const from = payload.From
      const body = payload.Body
      logger.info(`[WhatsApp] From: ${from}, Body: ${body}`)
      if (!from || !body) {
        logger.warn('[WhatsApp] Missing From or Body — sending empty TwiML')
        res.type('text/xml').send(emptyTwimlResponse())
        return
      }

      
      logger.info('[WhatsApp] Calling whatsappService.handleIncomingMessage...')
      const twimlReply = await whatsappService.handleIncomingMessage(from, body)
      logger.info(`[WhatsApp] Reply generated: ${twimlReply}`)

      res.type('text/xml').send(twimlReply)
      logger.info('[WhatsApp] Response sent successfully')

    } catch (error) {
      logger.error(`[WhatsApp] Controller error: ${error}`)
      res.type('text/xml').send(emptyTwimlResponse())
    }
  }
}