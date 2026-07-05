import { Request, Response, NextFunction } from "express";
import { OrganisationService } from "../services/organisation.service";
import { MemberService } from "../services/member.service";

import { prisma } from "../lib/prisma";
import { CollectionService } from "../services/collection.service";
import { CycleStatus } from "../generated/prisma/enums";
import { AppError } from "../middleware/error.middleware";

export class DashboardController {
  constructor(
    private readonly orgService: OrganisationService,
    private readonly memberService: MemberService,
    private readonly collectionService: CollectionService,
  ) {}

  async getOverview(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = req.params.orgId as string;

      const [org, balance, members] = await Promise.all([
        this.orgService.getById(orgId),
        this.orgService.getBalance(orgId),
        this.memberService.getAllByOrgWithChargeStatus(orgId),
      ]);

      const currentCycle = await prisma.cycle.findFirst({
        where: { collection: { orgId }, status: CycleStatus.OPEN },
        orderBy: { openedAt: "desc" },
        include: {
          charges: {
            include: { member: true },
          },
        },
      });

      const charges = currentCycle?.charges ?? [];

      const paidCharges = charges.filter(
        (c) => c.status === "PAID" || c.status === "OVERPAID",
      );
      const pendingCharges = charges.filter(
        (c) => c.status === "PENDING" || c.status === "UNDERPAID",
      );
      const overdueCharges = charges.filter((c) => c.status === "OVERDUE");

      const totalCollectedThisCycle = paidCharges.reduce(
        (sum, c) => sum + c.amount,
        0,
      );
      const outstandingThisCycle = pendingCharges.reduce((sum, c) => {
        if (c.status === "UNDERPAID") {
          return sum + (c.amount - (c.paidSoFar || 0));
        }
        return sum + c.amount;
      }, 0);

      // sort: overdue first, then pending, then paid
      const statusOrder: Record<string, number> = {
        OVERDUE: 0,
        UNDERPAID: 1,
        PENDING: 2,
        PAID: 3,
        OVERPAID: 4,
      };
      const sortedCharges = [...charges].sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status],
      );

      const recentActivity = await prisma.charge.findMany({
        where: {
          member: { orgId },
          status: { in: ["PAID", "OVERPAID"]},
        },
        include: { member: true },
        orderBy: { paidAt: "desc" },
        take: 20,
      });

      res.status(200).json({
        success: true,
        data: {
          org,
          balance,
          currentCycle: currentCycle ? {
            id: currentCycle.id,
            period: currentCycle.period,
            dueDate: currentCycle.dueDate,
            status: currentCycle.status,
            totalCollected: totalCollectedThisCycle,
            outstanding: outstandingThisCycle,
            paidCount: paidCharges.length,
            pendingCount: pendingCharges.length,
            overdueCount: overdueCharges.length,
            charges: sortedCharges, 
          }: null,
          recentActivity,
          totalMembers: members.length,
          unsentAccounts: members.filter((m) => !m.accountSent).length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

   async getArrears(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.params.orgId as string

      const arrearsCharges = await prisma.charge.findMany({
        where: {
          member: { orgId },
          status: 'OVERDUE',
          cycle: {
            status: { in: [CycleStatus.CLOSED, CycleStatus.ARCHIVED] }
          }
        },
        include: {
          member: true,
          cycle: true
        },
        orderBy: { createdAt: 'desc' }
      })

      const totalArrearsAmount = arrearsCharges.reduce(
        (sum, c) => sum + (c.amount - (c.paidSoFar || 0)), 0
      )

      const byMember = arrearsCharges.reduce<Record<string, {
        member: typeof arrearsCharges[0]['member']
        totalOwed: number
        charges: typeof arrearsCharges
      }>>((acc, charge) => {
        const memberId = charge.memberId
        if (!acc[memberId]) {
          acc[memberId] = {
            member: charge.member,
            totalOwed: 0,
            charges: []
          }
        }
        acc[memberId].totalOwed += charge.amount - (charge.paidSoFar || 0)
        acc[memberId].charges.push(charge)
        return acc
      }, {})

      res.status(200).json({
        success: true,
        data: {
          totalArrearsAmount,
          membersInArrears: Object.keys(byMember).length,
          totalCharges: arrearsCharges.length,
          byMember: Object.values(byMember),
          charges: arrearsCharges
        }
      })
    } catch (error) {
      next(error)
    }
  }

   async openNewCycle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.params.orgId as string
      const { collectionId, dueDate } = req.body

      if (!collectionId) {
        throw new AppError('collectionId is required', 400)
      }

      if (!dueDate) {
        throw new AppError('dueDate is required', 400)
      }

      const parsedDueDate = new Date(dueDate)
      if (isNaN(parsedDueDate.getTime())) {
        throw new AppError('dueDate must be a valid date', 400)
      }

      if (parsedDueDate <= new Date()) {
        throw new AppError('dueDate must be in the future', 400)
      }

      await this.collectionService.openCustomCycle(orgId, collectionId, parsedDueDate)

      res.status(200).json({
        success: true,
        message: `New cycle opened — due ${parsedDueDate.toDateString()}`
      })
    } catch (error) {
      next(error)
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.params.orgId as string
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
      const skip = (page - 1) * limit

      // get all VA numbers for this org's members in one query
      const memberVaNumbers = await prisma.member
        .findMany({
          where: { orgId },
          select: { vaNumber: true }
        })
        .then(ms => ms.map(m => m.vaNumber))

      // get payout transfer refs for this org
      const payoutRefs = await prisma.payout
        .findMany({
          where: { orgId, transferRef: { not: null } },
          select: { transferRef: true }
        })
        .then(ps => ps.map(p => p.transferRef!))

      // fetch payment events (by VA number) and payout events (by transferRef)
      // in parallel then merge
      const [paymentEvents, payoutEvents, totalPayment, totalPayout] =
        await Promise.all([
          prisma.webhookEvent.findMany({
            where: { accountRef: { in: memberVaNumbers } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
          }),
          prisma.webhookEvent.findMany({
            where: {
              eventType: { in: ['payout_success', 'payout_refund'] },
              txRef: { in: payoutRefs }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip
          }),
          prisma.webhookEvent.count({
            where: { accountRef: { in: memberVaNumbers } }
          }),
          prisma.webhookEvent.count({
            where: {
              eventType: { in: ['payout_success', 'payout_refund'] },
              txRef: { in: payoutRefs }
            }
          })
        ])

      // merge and sort by date descending, then paginate
      const allEvents = [...paymentEvents, ...payoutEvents]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)

      // enrich with member data
      const enriched = await Promise.all(
        allEvents.map(async event => {
          const member = event.accountRef
            ? await prisma.member.findFirst({
                where: { vaNumber: event.accountRef },
                select: { id: true, name: true, identifier: true }
              })
            : null

          return {
            id: event.id,
            eventType: event.eventType,
            amount: event.amount,
            reconciliationStatus: event.reconciliationStatus,
            txRef: event.txRef,
            processed: event.processed,
            processedAt: event.processedAt,
            createdAt: event.createdAt,
            member
          }
        })
      )

      res.status(200).json({
        success: true,
        data: {
          transactions: enriched,
          pagination: {
            total: totalPayment + totalPayout,
            page,
            limit,
            pages: Math.ceil((totalPayment + totalPayout) / limit)
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }

}