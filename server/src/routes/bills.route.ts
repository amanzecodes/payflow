import { Router } from 'express'
import { BillsService } from '../services/bills.service'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PayoutRepository } from '../repositories/payout.repository'
import { paymentProvider } from '../providers'
import { authenticate, requireOrgAccess } from '../middleware/auth.middleware'
import { BillsController } from '../controllers/bills.controllers';

const router = Router({ mergeParams: true })

const billsService = new BillsService(
  new OrganisationRepository(),
  new ChargeRepository(),
  new PayoutRepository(),
  paymentProvider
)

const billsController = new BillsController(billsService)

router.use(authenticate)
router.use(requireOrgAccess)


router.post(
  '/airtime',
  (req, res, next) => billsController.vendAirtime(req, res, next)
)

router.get(
  '/history',
  (req, res, next) => billsController.getBillsHistory(req, res, next)
)

export default router