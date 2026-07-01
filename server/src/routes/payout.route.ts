import { Router } from 'express'
import { PayoutRepository } from '../repositories/payout.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PayoutService } from '../services/payout.service'
import { PayoutController } from '../controllers/payout.controller'
import { authenticate, requireOrgAccess } from '../middleware/auth.middleware'
import { paymentProvider } from '../providers'

const router = Router({ mergeParams: true })

const payoutRepo = new PayoutRepository()
const orgRepo = new OrganisationRepository()
const chargeRepo = new ChargeRepository()
const payoutService = new PayoutService(payoutRepo, orgRepo, chargeRepo, paymentProvider)
const payoutController = new PayoutController(payoutService)

router.use(authenticate)
router.use(requireOrgAccess)

router.get(
  '/payout-page',
  (req, res, next) => payoutController.getPayoutPage(req, res, next)
)

router.post(
  '/',
  (req, res, next) => payoutController.requestPayout(req, res, next)
)

router.get(
  '/',
  (req, res, next) => payoutController.getAllByOrg(req, res, next)
)

router.get(
  '/:payoutId',
  (req, res, next) => payoutController.getById(req, res, next)
)

export default router