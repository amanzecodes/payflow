import { Collection, CycleFrequency, CycleStatus } from '../generated/prisma/client'
import { CollectionRepository } from '../repositories/collection.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { AppError } from '../middleware/error.middleware'
import { prisma } from '../lib/prisma'
import { format, endOfMonth, endOfQuarter, endOfYear, addYears } from 'date-fns'
import { logger } from '../lib/logger';

export class CollectionService {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly orgRepo: OrganisationRepository
  ) {}

  async create(data: {
    orgId: string
    name: string
    amount?: number
    cycle: string
    dueDate?: Date
  }): Promise<Collection> {
    const org = await this.orgRepo.findById(data.orgId)
    if (!org) throw new AppError('Organisation not found', 404)

    const existing = await this.collectionRepo.findAllByOrg(data.orgId)
    const duplicate = existing.find(
      c => c.name.toLowerCase() === data.name.toLowerCase()
    )
    if (duplicate) throw new AppError('A collection with this name already exists', 409)

    if (
      (data.cycle === 'ONE_TIME' || data.cycle === 'CUSTOM') &&
      !data.dueDate
    ) {
      throw new AppError(
        `A due date is required for ${data.cycle} collections`,
        400
      )
    }

    const collection = await this.collectionRepo.create({
      name: data.name,
      amount: data.amount,
      cycle: data.cycle as CycleFrequency,
      org: { connect: { id: data.orgId } }
    })

    await this.openFirstCycle(collection.id, data.cycle as CycleFrequency, data.dueDate)

    return collection
  }

    // opens the very first cycle when a collection is created
  // subsequent cycles for MONTHLY/YEARLY are opened by the cron job
  // subsequent cycles for CUSTOM are opened manually by the admin
  private async openFirstCycle(
    collectionId: string,
    frequency: CycleFrequency,
    customDueDate?: Date
  ): Promise<void> {
    const now = new Date()

    switch (frequency) {
      case CycleFrequency.MONTHLY: {
        const period = format(now, 'yyyy-MM')
        const dueDate = endOfMonth(now)
        await this.createCycleIfNotExists(collectionId, period, dueDate)
        break
      }

      case CycleFrequency.YEARLY: {
        const period = format(now, 'yyyy')
        const dueDate = endOfYear(now)
        await this.createCycleIfNotExists(collectionId, period, dueDate)
        break
      }

      case CycleFrequency.ONE_TIME: {
        const existing = await prisma.cycle.findFirst({
          where: { collectionId }
        })
        if (existing) {
          logger.warn(
            `[CollectionService] ONE_TIME cycle already exists for collection: ${collectionId}`
          )
          return
        }

        await prisma.cycle.create({
          data: {
            collectionId,
            period: 'ONE-TIME',
            dueDate: customDueDate,
            status: CycleStatus.OPEN
          }
        })
        logger.info(
          `[CollectionService] ONE_TIME cycle opened — due: ${customDueDate?.toDateString()}`
        )
        break
      }

      case CycleFrequency.CUSTOM: {
        const existing = await prisma.cycle.findFirst({
          where: { collectionId }
        })
        if (existing) {
          logger.warn(
            `[CollectionService] CUSTOM cycle already exists for collection: ${collectionId}`
          )
          return
        }

        const period = `CUSTOM-${format(now, 'yyyy-MM-dd')}`
        await prisma.cycle.create({
          data: {
            collectionId,
            period,
            dueDate: customDueDate,
            status: CycleStatus.OPEN
          }
        })
        logger.info(
          `[CollectionService] CUSTOM cycle opened — period: ${period}, due: ${customDueDate?.toDateString()}`
        )
        break
      }

      default:
        logger.warn(`[CollectionService] Unknown cycle frequency: ${frequency}`)
    }
  }

   private async createCycleIfNotExists(
    collectionId: string,
    period: string,
    dueDate: Date
  ): Promise<void> {
    const existing = await prisma.cycle.findUnique({
      where: { collectionId_period: { collectionId, period } }
    })

    if (existing) {
      logger.info(
        `[CollectionService] Cycle ${period} already exists for collection: ${collectionId}`
      )
      return
    }

    await prisma.cycle.create({
      data: { collectionId, period, dueDate, status: CycleStatus.OPEN }
    })

    logger.info(
      `[CollectionService] Cycle ${period} opened — due: ${dueDate.toDateString()}`
    )
  }

  // opens a new CUSTOM cycle manually — called by admin via WhatsApp or web
  // archives the current cycle first, marks unpaid charges overdue
  async openCustomCycle(
    orgId: string,
    collectionId: string,
    dueDate: Date
  ): Promise<void> {
    const collection = await this.collectionRepo.findById(collectionId)
    if (!collection) throw new AppError('Collection not found', 404)
    if (collection.orgId !== orgId) throw new AppError('Unauthorised', 403)

    // only CUSTOM collections can have manually opened cycles
    if (collection.cycle !== CycleFrequency.CUSTOM) {
      throw new AppError(
        'Only CUSTOM collections support manual cycle opening',
        400
      )
    }

    const now = new Date()

    await prisma.$transaction(async tx => {
      // 1. archive any existing OPEN or CLOSED cycles for this collection
      const archivedCount = await tx.cycle.updateMany({
        where: {
          collectionId,
          status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED] }
        },
        data: { status: CycleStatus.ARCHIVED }
      })

      logger.info(
        `[CollectionService] Archived ${archivedCount.count} cycles for collection: ${collectionId}`
      )

      // 2. mark all PENDING and UNDERPAID charges from archived cycles as OVERDUE
      // this represents the admin deciding the grace period is over
      const overdueCount = await tx.charge.updateMany({
        where: {
          cycle: {
            collectionId,
            status: CycleStatus.ARCHIVED
          },
          status: { in: ['PENDING', 'UNDERPAID'] }
        },
        data: { status: 'OVERDUE' }
      })

      logger.info(
        `[CollectionService] Marked ${overdueCount.count} charges as OVERDUE`
      )

      // 3. get all active members for this org to create charges
      const activeMembers = await tx.member.findMany({
        where: { orgId, status: 'ACTIVE' }
      })

      if (activeMembers.length === 0) {
        logger.warn(
          `[CollectionService] No active members for org: ${orgId} — cycle opened with no charges`
        )
      }

      // 4. open the new cycle
      const period = `CUSTOM-${format(now, 'yyyy-MM-dd')}`

      // guard against duplicate period — add timestamp suffix if needed
      const existing = await tx.cycle.findUnique({
        where: { collectionId_period: { collectionId, period } }
      })

      const finalPeriod = existing ? `${period}-${Date.now()}` : period

      const newCycle = await tx.cycle.create({
        data: {
          collectionId,
          period: finalPeriod,
          dueDate,
          status: CycleStatus.OPEN
        }
      })

      // 5. create PENDING charges for all active members
      if (activeMembers.length > 0) {
        await tx.charge.createMany({
          data: activeMembers
            .filter(m => m.expectedAmount > 0)
            .map(m => ({
              memberId: m.id,
              cycleId: newCycle.id,
              amount: m.expectedAmount,
              status: 'PENDING',
              paidSoFar: 0
            })),
          skipDuplicates: true
        })
      }

      logger.info(
        `[CollectionService] New CUSTOM cycle opened — period: ${finalPeriod}, due: ${dueDate.toDateString()}, charges: ${activeMembers.length}`
      )
    })
  }


  async getByOrg(orgId: string): Promise<Collection[]> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new AppError('Organisation not found', 404)
    return this.collectionRepo.findAllByOrg(orgId)
  }

  async getById(id: string): Promise<Collection> {
    const collection = await this.collectionRepo.findById(id)
    if (!collection) throw new AppError('Collection not found', 404)
    return collection
  }

  async update(id: string, data: Partial<{
    name: string
    amount: number
  }>): Promise<Collection> {
    await this.getById(id)
    return this.collectionRepo.update(id, data)
  }

  async getCurrentCycle(collectionId: string) {
    return prisma.cycle.findFirst({
      where: {
        collectionId,
        dueDate: { gt: new Date() }
      },
      orderBy: { openedAt: 'desc' },
      include: {
        charges: {
          include: { member: true }
        }
      }
    })
  }

  async getAllCycles(collectionId: string) {
    return prisma.cycle.findMany({
      where: { collectionId },
      orderBy: { openedAt: 'desc' },
      include: {
        _count: {
          select: { charges: true }
        }
      }
    })
  }
}