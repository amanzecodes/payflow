import twilio from 'twilio'
import { env } from '../config/env'

export const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<void> {
  await twilioClient.messages.create({
    from: env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${to}`,
    body: message
  })
}

export function twimlResponse(message: string): string {
  const twiml = new twilio.twiml.MessagingResponse()
  twiml.message(message)
  return twiml.toString()
}

export function emptyTwimlResponse(): string {
  const twiml = new twilio.twiml.MessagingResponse()
  return twiml.toString()
}