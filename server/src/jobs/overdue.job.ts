import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'

export async function markOverdueCharges(): Promise<void> {
  logger.info('[CronJob] Checking for overdue charges...')

  try {
    const result = await prisma.charge.updateMany({
      where: {
        status: 'PENDING',
        cycle: {
          dueDate: { lt: new Date() }
        }
      },
      data: { status: 'OVERDUE' }
    })

    logger.info(`[CronJob] Marked ${result.count} charges as overdue`)
  } catch (error) {
    logger.error(`[CronJob] Error marking overdue charges: ${error}`)
  }
}

export async function startOverdueJob(): Promise<void> {
  const cron = await import('node-cron')
  cron.schedule('0 0 * * *', markOverdueCharges, {
    timezone: 'Africa/Lagos'
  })
  logger.info('[CronJob] Overdue job scheduled — runs daily at midnight Lagos time')
}