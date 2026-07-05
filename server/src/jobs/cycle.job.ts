import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { CycleFrequency, CycleStatus } from '../generated/prisma/client'
import { format, endOfMonth, endOfYear } from 'date-fns'

export async function openCycles(): Promise<void> {
  logger.info('[CycleJob] Opening new cycles for MONTHLY and YEARLY collections...')

  try {
    const now = new Date()

    // only fetch MONTHLY and YEARLY collections
    // CUSTOM and ONE_TIME are never touched by the cron
    const collections = await prisma.collection.findMany({
      where: {
        cycle: { in: [CycleFrequency.MONTHLY, CycleFrequency.YEARLY] }
      },
      include: {
        org: {
          include: {
            members: { where: { status: 'ACTIVE' } }
          }
        }
      }
    })

    for (const collection of collections) {
      let period: string
      let dueDate: Date

      switch (collection.cycle) {
        case CycleFrequency.MONTHLY:
          period = format(now, 'yyyy-MM')
          dueDate = endOfMonth(now)
          break

        case CycleFrequency.YEARLY:
          period = format(now, 'yyyy')
          dueDate = endOfYear(now)
          break

        default:
          continue
      }

      // check if this period already has a cycle — prevents duplicate opening
      const existingCycle = await prisma.cycle.findUnique({
        where: {
          collectionId_period: {
            collectionId: collection.id,
            period
          }
        }
      })

      if (existingCycle) {
        logger.info(
          `[CycleJob] Cycle ${period} already exists for ${collection.name} — skipping`
        )
        continue
      }

      await prisma.$transaction(async tx => {
        // archive the previous OPEN or CLOSED cycle before opening the new one
        // this ensures only one cycle is OPEN at any time per collection
        const archived = await tx.cycle.updateMany({
          where: {
            collectionId: collection.id,
            status: { in: [CycleStatus.OPEN, CycleStatus.CLOSED] }
          },
          data: { status: CycleStatus.ARCHIVED }
        })

        if (archived.count > 0) {
          logger.info(
            `[CycleJob] Archived ${archived.count} previous cycles for ${collection.name}`
          )
        }

        // open the new cycle
        const newCycle = await tx.cycle.create({
          data: {
            collectionId: collection.id,
            period,
            dueDate,
            status: CycleStatus.OPEN
          }
        })

        const activeMembers = collection.org.members

        if (activeMembers.length === 0) {
          logger.info(
            `[CycleJob] No active members for ${collection.name} — cycle opened with no charges`
          )
          return
        }

        // create PENDING charges for every active member
        // skip members with no expectedAmount set
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

        logger.info(
          `[CycleJob] Opened ${period} cycle for ${collection.name} — ${activeMembers.length} charges created`
        )
      })
    }

    logger.info('[CycleJob] Cycle opening complete')
  } catch (error) {
    logger.error(`[CycleJob] Error opening cycles: ${error}`)
  }
}

export async function startCycleJob(): Promise<void> {
  const cron = await import('node-cron')
  cron.schedule('0 0 1 * *', openCycles, {
    timezone: 'Africa/Lagos'
  })
  logger.info(
    '[CycleJob] Scheduled — runs 1st of every month at midnight (Lagos time)'
  )
}