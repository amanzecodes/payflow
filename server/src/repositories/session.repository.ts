import { ConversationSession, ConversationRole, ConversationStep, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class SessionRepository {
  async findByPhone(phone: string): Promise<ConversationSession | null> {
    return prisma.conversationSession.findUnique({ where: { phone } })
  }

  async upsert(phone: string, data: Partial<Prisma.ConversationSessionCreateInput>): Promise<ConversationSession> {
    return prisma.conversationSession.upsert({
      where: { phone },
      update: { ...data, updatedAt: new Date() },
      create: {
        phone,
        role: ConversationRole.NEW,
        step: ConversationStep.AWAITING_ORG_NAME,
        context: {},
        ...data
      }
    })
  }

  async updateStep(phone: string, step: ConversationStep, context?: object): Promise<ConversationSession> {
    return prisma.conversationSession.update({
      where: { phone },
      data: { step, ...(context && { context }), updatedAt: new Date() }
    })
  }

  async delete(phone: string): Promise<void> {
    await prisma.conversationSession.delete({ where: { phone } })
  }
}