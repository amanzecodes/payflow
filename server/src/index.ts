import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import app from './app'
import { prisma } from './lib/prisma'
import { env } from './config/env'
import { logger } from './lib/logger'
import { startOverdueJob } from './jobs/overdue.job'
import { startCycleJob } from './jobs/cycle.job'

const httpServer = http.createServer(app)

export const io = new Server(httpServer, {
  cors: { origin: '*' }
})

io.on('connection', (socket) => {
  socket.on('join:org', (orgId: string) => {
    socket.join(orgId)
  })
})

httpServer.listen(env.PORT, async () => {
  logger.info(`PayFlow API running on port ${env.PORT}`)
  await prisma.$connect()
  logger.info('Database connected')

  await startOverdueJob()
  await startCycleJob()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})