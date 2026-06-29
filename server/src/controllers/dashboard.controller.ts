import { Request, Response, NextFunction } from 'express'
import { OrganisationService } from '../services/organisation.service'
import { MemberService } from '../services/member.service'
import { ChargeRepository } from '../repositories/charge.repository'
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
        this.memberService.getAllByOrg(orgId),
      ])

      // get current cycle
      const currentCycle = await prisma.cycle.findFirst({
        where: { collection: { orgId } },
        orderBy: { openedAt: 'desc' },
        include: {
          charges: {
            include: { member: true }
          }
        }
      })

      // count statuses
      const paid = currentCycle?.charges.filter(c => c.status === 'PAID').length ?? 0
      const pending = currentCycle?.charges.filter(c => c.status === 'PENDING').length ?? 0
      const overdue = currentCycle?.charges.filter(c => c.status === 'OVERDUE').length ?? 0

      // recent activity — last 20 paid charges
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
            paid,
            pending,
            overdue,
            charges: currentCycle?.charges ?? []
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