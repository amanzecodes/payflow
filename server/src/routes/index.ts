import { Router } from 'express'
import authRoutes from './auth.routes'
import organisationRoutes from './organisation.route'
import memberRoutes from './member.route'
import payoutRoutes from './payout.route'
import webhookRoutes from './webhook.routes'
import dashboardRoutes from './dashboard.route'
import collectionRoutes from './collection.route'
import whatsappRoutes from './whatsapp.route'
import banksRoutes from './banks.route'
import feeLineRoutes from './feeline.route'

const router = Router()

router.use('/auth', authRoutes)
router.use('/organisations', organisationRoutes)
router.use('/organisations/:orgId/members', memberRoutes)
router.use('/organisations/:orgId/payouts', payoutRoutes)
router.use('/webhooks', webhookRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/organisations/:orgId/collections', collectionRoutes)
router.use('/whatsapp', whatsappRoutes)
router.use('/banks', banksRoutes)
router.use('/fee-lines', feeLineRoutes)

export { router }