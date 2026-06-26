import { Payout, PayoutStatus, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class PayoutRepository {
  async findById(id: string): Promise<Payout | null> {
    return prisma.payout.findUnique({ where: { id } })
  }

  async findAllByOrg(orgId: string): Promise<Payout[]> {
    return prisma.payout.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getTotalCompletedByOrg(orgId: string): Promise<number> {
    const result = await prisma.payout.aggregate({
      where: {
        orgId,
        status: PayoutStatus.COMPLETED
      },
      _sum: { amount: true }
    })
    return result._sum.amount ?? 0
  }

  async create(data: Prisma.PayoutCreateInput): Promise<Payout> {
    return prisma.payout.create({ data })
  }

  async markCompleted(id: string, transferRef: string): Promise<Payout> {
    return prisma.payout.update({
      where: { id },
      data: {
        status: PayoutStatus.COMPLETED,
        transferRef,
        completedAt: new Date()
      }
    })
  }

  async markFailed(id: string): Promise<Payout> {
    return prisma.payout.update({
      where: { id },
      data: { status: PayoutStatus.FAILED }
    })
  }
}