import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { CycleFrequency } from '../generated/prisma/enums'
import { format, endOfMonth, endOfQuarter, endOfYear } from 'date-fns'

export async function openCycles(): Promise<void> {
  logger.info('[CronJob] Opening new cycles...')

  try {
    const now = new Date()

    const collections = await prisma.collection.findMany({
      include: {
        org: {
          include: {
            members: {
              where: { status: 'ACTIVE' }
            }
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
        case CycleFrequency.QUARTERLY:
          period = `${format(now, 'yyyy')}-Q${Math.ceil((now.getMonth() + 1) / 3)}`
          dueDate = endOfQuarter(now)
          break
        case CycleFrequency.YEARLY:
          period = format(now, 'yyyy')
          dueDate = endOfYear(now)
          break
        case CycleFrequency.TERMLY:
          continue
        default:
          continue
      }

      // check if cycle already exists for this period
      const existingCycle = await prisma.cycle.findUnique({
        where: {
          collectionId_period: {
            collectionId: collection.id,
            period
          }
        }
      })

      if (existingCycle) {
        logger.info(`[CronJob] Cycle already exists for ${collection.name} — ${period}`)
        continue
      }

      // open cycle and create charges in one transaction
      await prisma.$transaction(async (tx) => {
        const cycle = await tx.cycle.create({
          data: {
            collectionId: collection.id,
            period,
            dueDate,
          }
        })

        const activeMembers = collection.org.members

        if (activeMembers.length === 0) {
          logger.info(`[CronJob] No active members for ${collection.name}`)
          return
        }

        await tx.charge.createMany({
          data: activeMembers.map(member => ({
            memberId: member.id,
            cycleId: cycle.id,
            amount: member.expectedAmount,
            status: 'PENDING'
          })),
          skipDuplicates: true
        })

        logger.info(
          `[CronJob] Opened cycle ${period} for ${collection.name} — ${activeMembers.length} charges created`
        )
      })
    }

    logger.info('[CronJob] Cycle opening complete')
  } catch (error) {
    logger.error(`[CronJob] Error opening cycles: ${error}`)
  }
}

export async function startCycleJob(): Promise<void> {
  const cron = await import('node-cron')
  cron.schedule('0 0 1 * *', openCycles, {
    timezone: 'Africa/Lagos'
  })
  logger.info('[CronJob] Cycle job scheduled — runs 1st of every month at midnight Lagos time')
}