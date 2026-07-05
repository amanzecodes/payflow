import { Request, Response, NextFunction } from "express";
import { OrganisationService } from "../services/organisation.service";
import { MemberService } from "../services/member.service";

import { prisma } from "../lib/prisma";
import { CollectionService } from "../services/collection.service";
import {
  CycleStatus,
  WebhookReconciliationStatus,
} from "../generated/prisma/enums";
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
          status: { in: ["PAID", "OVERPAID"] },
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
          currentCycle: currentCycle
            ? {
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
              }
            : null,
          recentActivity,
          totalMembers: members.length,
          unsentAccounts: members.filter((m) => !m.accountSent).length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getArrears(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = req.params.orgId as string;

      const arrearsCharges = await prisma.charge.findMany({
        where: {
          member: { orgId },
          status: "OVERDUE",
          cycle: {
            status: { in: [CycleStatus.CLOSED, CycleStatus.ARCHIVED] },
          },
        },
        include: {
          member: true,
          cycle: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const totalArrearsAmount = arrearsCharges.reduce(
        (sum, c) => sum + (c.amount - (c.paidSoFar || 0)),
        0,
      );

      const byMember = arrearsCharges.reduce<
        Record<
          string,
          {
            member: (typeof arrearsCharges)[0]["member"];
            totalOwed: number;
            charges: typeof arrearsCharges;
          }
        >
      >((acc, charge) => {
        const memberId = charge.memberId;
        if (!acc[memberId]) {
          acc[memberId] = {
            member: charge.member,
            totalOwed: 0,
            charges: [],
          };
        }
        acc[memberId].totalOwed += charge.amount - (charge.paidSoFar || 0);
        acc[memberId].charges.push(charge);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        data: {
          totalArrearsAmount,
          membersInArrears: Object.keys(byMember).length,
          totalCharges: arrearsCharges.length,
          byMember: Object.values(byMember),
          charges: arrearsCharges,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async openNewCycle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = req.params.orgId as string;
      const { collectionId, dueDate } = req.body;

      if (!collectionId) {
        throw new AppError("collectionId is required", 400);
      }

      if (!dueDate) {
        throw new AppError("dueDate is required", 400);
      }

      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new AppError("dueDate must be a valid date", 400);
      }

      if (parsedDueDate <= new Date()) {
        throw new AppError("dueDate must be in the future", 400);
      }

      await this.collectionService.openCustomCycle(
        orgId,
        collectionId,
        parsedDueDate,
      );

      res.status(200).json({
        success: true,
        message: `New cycle opened — due ${parsedDueDate.toDateString()}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = req.params.orgId as string;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const skip = (page - 1) * limit;

      
      const memberVaNumbers = await prisma.member
        .findMany({ where: { orgId }, select: { vaNumber: true } })
        .then((ms) => ms.map((m) => m.vaNumber));

     
      if (memberVaNumbers.length === 0) {
        const payouts = await prisma.payout.findMany({
          where: { orgId },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        if (payouts.length === 0) {
          res.status(200).json({
            success: true,
            data: {
              stats: {
                totalVolume: 0,
                totalCount: 0,
                moneyIn: 0,
                moneyInCount: 0,
                moneyOut: 0,
                needsAttention: 0,
                pendingCount: 0,
                failedCount: 0,
                successCount: 0,
              },
              transactions: [],
              pagination: { total: 0, page, limit, pages: 0 },
            },
          });
          return;
        }
      }

     
      const paymentEvents =
        memberVaNumbers.length > 0
          ? await prisma.webhookEvent.findMany({
              where: { accountRef: { in: memberVaNumbers } },
              orderBy: { createdAt: "desc" },
              take: 500,
            })
          : [];

      
      const payoutRecords = await prisma.payout.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

   
      const membersByVaNumber =
        memberVaNumbers.length > 0
          ? await prisma.member
              .findMany({
                where: { vaNumber: { in: memberVaNumbers } },
                select: {
                  id: true,
                  name: true,
                  identifier: true,
                  vaNumber: true,
                },
              })
              .then((members) => new Map(members.map((m) => [m.vaNumber, m])))
          : new Map();



      const shapedPayments = paymentEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        type: "Payment" as const,
        method: "Virtual Account" as const,
        amount: event.amount,
        reconciliationStatus: event.reconciliationStatus,
        txRef: event.txRef,
        processed: event.processed,
        processedAt: event.processedAt?.toISOString() ?? null,
        createdAt: event.createdAt.toISOString(),
        member: event.accountRef
          ? (() => {
              const m = membersByVaNumber.get(event.accountRef!);
              return m
                ? { id: m.id, name: m.name, identifier: m.identifier }
                : null;
            })()
          : null,
        payout: null,
      }));

     

      const shapedPayouts = payoutRecords.map((payout) => ({
        id: payout.id,
        eventType: "payout" as const,
        type: "Payout" as const,
        method: "Bank Transfer" as const,
        amount: payout.amount,
        reconciliationStatus:
          payout.status === "COMPLETED"
            ? "PAYOUT_SUCCESS"
            : payout.status === "FAILED"
              ? "PAYOUT_REFUNDED"
              : "PENDING",
        txRef: payout.transferRef ?? null,
        processed: payout.status !== "PENDING",
        processedAt: payout.completedAt?.toISOString() ?? null,
        createdAt: payout.createdAt.toISOString(),
        member: null,
        payout: payout.bankAccount
          ? {
              bankName: payout.bankName,
              last4: payout.bankAccount.slice(-4),
            }
          : null,
      }));

      

      const merged = [...shapedPayments, ...shapedPayouts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const totalCount = merged.length;
      const paginated = merged.slice(skip, skip + limit);

     

      const [
        moneyInAgg,
        moneyOutAgg,
        needsAttentionCount,
        pendingCount,
        failedCount,
      ] = await Promise.all([
        
        memberVaNumbers.length > 0
          ? prisma.webhookEvent.aggregate({
              where: {
                accountRef: { in: memberVaNumbers },
                reconciliationStatus: WebhookReconciliationStatus.SUCCESS,
              },
              _sum: { amount: true },
              _count: { id: true },
            })
          : Promise.resolve({ _sum: { amount: 0 }, _count: { id: 0 } }),

        
        prisma.payout.aggregate({
          where: {
            orgId,
            status: "COMPLETED",
          },
          _sum: { amount: true },
        }),

        
        memberVaNumbers.length > 0
          ? prisma.webhookEvent.count({
              where: {
                accountRef: { in: memberVaNumbers },
                reconciliationStatus: {
                  in: [
                    WebhookReconciliationStatus.UNDERPAYMENT,
                    WebhookReconciliationStatus.PAYMENT_FAILED,
                  ],
                },
              },
            })
          : Promise.resolve(0),

        
        memberVaNumbers.length > 0
          ? prisma.webhookEvent.count({
              where: {
                accountRef: { in: memberVaNumbers },
                processed: false,
              },
            })
          : Promise.resolve(0),

        
        memberVaNumbers.length > 0
          ? prisma.webhookEvent.count({
              where: {
                accountRef: { in: memberVaNumbers },
                reconciliationStatus:
                  WebhookReconciliationStatus.PAYMENT_FAILED,
              },
            })
          : Promise.resolve(0),
      ]);

      const moneyIn = moneyInAgg._sum.amount ?? 0;
      const moneyOut = moneyOutAgg._sum.amount ?? 0;
      const successCount = moneyInAgg._count.id ?? 0;
      const totalVolume = moneyIn + moneyOut;

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalVolume,
            totalCount,
            moneyIn,
            moneyInCount: successCount,
            moneyOut,
            needsAttention: needsAttentionCount,
            pendingCount,
            failedCount,
            successCount,
          },
          transactions: paginated,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
