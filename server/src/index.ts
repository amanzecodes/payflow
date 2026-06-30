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

const port = parseInt(env.PORT, 10)

console.log('🚀 Attempting to start server on port', port)

httpServer.listen(port, '0.0.0.0', () => {
  console.log('✅ Server listening on port', port)
  logger.info(`PayFlow API running on port ${port}`)

  // Connect to database (non-blocking)
  prisma.$connect()
    .then(() => {
      logger.info('Database connected')
      startOverdueJob().catch(err => logger.error('Overdue job error:', err))
      startCycleJob().catch(err => logger.error('Cycle job error:', err))
    })
    .catch((error) => {
      logger.error('Database connection error:', error)
    })
})

httpServer.on('error', (error: any) => {
  console.error('❌ Server error:', error.message)
  logger.error('Server error:', error)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})