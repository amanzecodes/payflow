import { WebhookRepository } from '../repositories/webhook.repository'
import { MemberRepository } from '../repositories/member.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'

interface NombaWebhookPayload {
  event: string
  data: {
    accountRef: string
    transactionRef: string
    amount: number
  }
}

export class WebhookService {
  constructor(
    private readonly webhookRepo: WebhookRepository,
    private readonly memberRepo: MemberRepository,
    private readonly chargeRepo: ChargeRepository
  ) {}

  async processNombaWebhook(payload: NombaWebhookPayload): Promise<void> {
    // 1. write raw event to db immediately before anything else
    const event = await this.webhookRepo.create({
      eventType: payload.event,
      accountRef: payload.data?.accountRef,
      txRef: payload.data?.transactionRef,
      amount: payload.data?.amount,
      payload: payload as any,
      processed: false
    })

    if (payload.event !== 'payment_success') {
      logger.info(`[Webhook] Ignored event type: ${payload.event}`)
      return
    }

    // 2. idempotency check
    const alreadyProcessed = await this.webhookRepo.isProcessed(
      payload.data.transactionRef,
      event.id
    )

    if (alreadyProcessed) {
      logger.info(`[Webhook] Duplicate event ignored: ${payload.data.transactionRef}`)
      return
    }

    // 3. find member by accountRef
    const member = await this.memberRepo.findByAccountRef(payload.data.accountRef)
    if (!member) {
      logger.warn(`[Webhook] No member found for accountRef: ${payload.data.accountRef}`)
      return
    }

    // 4. find current pending charge for this member
    const charge = await this.chargeRepo.findPendingByMember(member.id)
    if (!charge) {
      logger.warn(`[Webhook] No pending charge found for member: ${member.id}`)
      return
    }

    // 5. mark charge paid and webhook processed atomically
    await prisma.$transaction([
      prisma.charge.update({
        where: { id: charge.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          txRef: payload.data.transactionRef
        }
      }),
      prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          processed: true,
          processedAt: new Date()
        }
      })
    ])

    logger.info(
      `[Webhook] Payment reconciled — ${member.name} (${member.identifier}) paid ₦${payload.data.amount}`
    )
  }

  async processTestWebhook(accountRef: string, amount: number): Promise<void> {
    const mockPayload: NombaWebhookPayload = {
      event: 'payment_success',
      data: {
        accountRef,
        transactionRef: `TEST-${Date.now()}`,
        amount
      }
    }
    await this.processNombaWebhook(mockPayload)
  }
}