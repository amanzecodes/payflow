import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { CycleStatus } from '../generated/prisma/client'

export async function markOverdueCharges(): Promise<void> {
  logger.info('[OverdueJob] Checking for overdue charges...')

  try {
    const now = new Date()

    
    const closedCycles = await prisma.cycle.updateMany({
      where: {
        status: CycleStatus.OPEN,
        dueDate: { lt: now }
        // dueDate is NOT null implicitly — prisma only matches non-null values
      },
      data: { status: CycleStatus.CLOSED }
    })

    if (closedCycles.count > 0) {
      logger.info(`[OverdueJob] Closed ${closedCycles.count} cycles`)
    }

    
    const overdueCharges = await prisma.charge.updateMany({
      where: {
        status: { in: ['PENDING', 'UNDERPAID'] },
        cycle: {
          dueDate: { lt: now }
        }
      },
      data: { status: 'OVERDUE' }
    })

    if (overdueCharges.count > 0) {
      logger.info(
        `[OverdueJob] Marked ${overdueCharges.count} charges as OVERDUE`
      )
    }

    logger.info('[OverdueJob] Complete')
  } catch (error) {
    logger.error(`[OverdueJob] Error: ${error}`)
  }
}

export async function startOverdueJob(): Promise<void> {
  const cron = await import('node-cron')
  cron.schedule('0 0 * * *', markOverdueCharges, {
    timezone: 'Africa/Lagos'
  })
  logger.info('[CronJob] Overdue job scheduled — runs daily at midnight Lagos time')
}