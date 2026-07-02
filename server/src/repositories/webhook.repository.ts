import { WebhookEvent, WebhookReconciliationStatus, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class WebhookRepository {
  async create(data: Prisma.WebhookEventCreateInput): Promise<WebhookEvent> {
    return prisma.webhookEvent.create({ data })
  }

  async isProcessed(txRef: string, excludeId: string): Promise<boolean> {
    const event = await prisma.webhookEvent.findFirst({
      where: { txRef, processed: true, id: { not: excludeId } }
    })
    return !!event
  }

  async markProcessed(id: string): Promise<WebhookEvent> {
    return prisma.webhookEvent.update({
      where: { id },
      data: { processed: true, processedAt: new Date() }
    })
  }

  async markProcessedWithStatus(
    id: string,
    reconciliationStatus: WebhookReconciliationStatus
  ): Promise<WebhookEvent> {
    return prisma.webhookEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        reconciliationStatus
      }
    })
  }
}