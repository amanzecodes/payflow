import { Router } from 'express'
import authRoutes from './auth.routes'
// import organisationRoutes from './organisation.routes'
// import memberRoutes from './member.routes'
// import payoutRoutes from './payout.routes'
// import webhookRoutes from './webhook.routes'
// import dashboardRoutes from './dashboard.routes'

const router = Router()

router.use('/auth', authRoutes)
// router.use('/organisations', organisationRoutes)
// router.use('/organisations/:orgId/members', memberRoutes)
// router.use('/organisations/:orgId/payouts', payoutRoutes)
// router.use('/webhooks', webhookRoutes)
// router.use('/dashboard', dashboardRoutes)

export { router }