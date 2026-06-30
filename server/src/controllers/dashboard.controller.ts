import { Request, Response, NextFunction } from 'express'
import { OrganisationService } from '../services/organisation.service'
import { MemberService } from '../services/member.service'

import { prisma } from '../lib/prisma'

export class DashboardController {
  constructor(
    private readonly orgService: OrganisationService,
    private readonly memberService: MemberService,
  ) {}

 async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.params.orgId as string

    const [org, balance, members] = await Promise.all([
      this.orgService.getById(orgId),
      this.orgService.getBalance(orgId),
      this.memberService.getAllByOrgWithChargeStatus(orgId),
    ])

    const currentCycle = await prisma.cycle.findFirst({
      where: { collection: { orgId } },
      orderBy: { openedAt: 'desc' },
      include: {
        charges: {
          include: { member: true }
        }
      }
    })

    const charges = currentCycle?.charges ?? []

    const paidCharges = charges.filter(c => c.status === 'PAID')
    const pendingCharges = charges.filter(c => c.status === 'PENDING')
    const overdueCharges = charges.filter(c => c.status === 'OVERDUE')

    const totalCollectedThisCycle = paidCharges.reduce((sum, c) => sum + c.amount, 0)
    const outstandingThisCycle = pendingCharges.reduce((sum, c) => sum + c.amount, 0)

    // sort: overdue first, then pending, then paid
    const statusOrder: Record<string, number> = { OVERDUE: 0, PENDING: 1, PAID: 2 }
    const sortedCharges = [...charges].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    )

    const recentActivity = await prisma.charge.findMany({
      where: {
        member: { orgId },
        status: 'PAID'
      },
      include: { member: true },
      orderBy: { paidAt: 'desc' },
      take: 20
    })

    res.status(200).json({
      success: true,
      data: {
        org,
        balance,
        currentCycle: {
          period: currentCycle?.period,
          dueDate: currentCycle?.dueDate,
          totalCollected: totalCollectedThisCycle,
          outstanding: outstandingThisCycle,
          paidCount: paidCharges.length,
          pendingCount: pendingCharges.length,
          overdueCount: overdueCharges.length,
          charges: sortedCharges  // ← now sorted overdue-first
        },
        recentActivity,
        totalMembers: members.length,
        unsentAccounts: members.filter(m => !m.accountSent).length
      }
    })
  } catch (error) {
    next(error)
  }
}
}