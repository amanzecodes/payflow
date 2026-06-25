import { ChargeStatus } from '../generated/prisma/enums'
import { Charge, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class ChargeRepository {
  async findById(id: string): Promise<Charge | null> {
    return prisma.charge.findUnique({ where: { id } })
  }

  async findByMemberAndCycle(memberId: string, cycleId: string): Promise<Charge | null> {
    return prisma.charge.findUnique({
      where: { memberId_cycleId: { memberId, cycleId } }
    })
  }

  async findPendingByMember(memberId: string): Promise<Charge | null> {
    return prisma.charge.findFirst({
      where: { memberId, status: ChargeStatus.PENDING },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findAllByMember(memberId: string): Promise<Charge[]> {
    return prisma.charge.findMany({
      where: { memberId },
      include: { cycle: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findAllByCycle(cycleId: string): Promise<Charge[]> {
    return prisma.charge.findMany({
      where: { cycleId },
      include: { member: true },
      orderBy: { createdAt: 'asc' }
    })
  }

  async createMany(data: Prisma.ChargeCreateManyInput[]): Promise<void> {
    await prisma.charge.createMany({ data, skipDuplicates: true })
  }

  async markPaid(id: string, txRef: string): Promise<Charge> {
    return prisma.charge.update({
      where: { id },
      data: { status: ChargeStatus.PAID, paidAt: new Date(), txRef }
    })
  }

  async markOverdue(id: string): Promise<Charge> {
    return prisma.charge.update({
      where: { id },
      data: { status: ChargeStatus.OVERDUE }
    })
  }

  async markAllOverdue(): Promise<void> {
    await prisma.charge.updateMany({
      where: {
        status: ChargeStatus.PENDING,
        cycle: { dueDate: { lt: new Date() } }
      },
      data: { status: ChargeStatus.OVERDUE }
    })
  }

  async getTotalPaidByOrg(orgId: string): Promise<number> {
    const result = await prisma.charge.aggregate({
      where: {
        member: { orgId },
        status: ChargeStatus.PAID
      },
      _sum: { amount: true }
    })
    return result._sum.amount ?? 0
  }
}