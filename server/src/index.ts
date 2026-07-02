import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { prisma } from './lib/prisma.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { startOverdueJob } from './jobs/overdue.job.js'
import { startCycleJob } from './jobs/cycle.job.js'
import { initSocket } from './lib/socket.js'  

const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_URL || 'http://localhost:3000', credentials: true }
})

initSocket(io)

io.on('connection', (socket) => {
  socket.on('join:org', (orgId: string) => {
    socket.join(orgId)
    logger.info(`[Socket] Dashboard connected for org: ${orgId}`)
  })
})

const port = parseInt(env.PORT, 10)

console.log('🚀 Attempting to start server on port', port)

httpServer.listen(port, '0.0.0.0', () => {
  console.log('✅ Server listening on port', port)
  logger.info(`PayFlow API running on port ${port}`)

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

httpServer.on('error', (error: NodeJS.ErrnoException) => {
  console.error('❌ Server error:', error.message)
  logger.error('Server error:', error)
})

process.on('SIGINT', async () => {
  if (env.PROVIDER === 'nomba') {
    const { NombaProvider } = await import('./providers/NombaProvider.js')
    const nomba = new NombaProvider()
    if (typeof nomba.revokeToken === 'function') {
      await nomba.revokeToken()
    }
  }
  await prisma.$disconnect()
  process.exit(0)
})