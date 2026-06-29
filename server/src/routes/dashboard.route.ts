import { Router } from 'express'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { MemberRepository } from '../repositories/member.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PayoutRepository } from '../repositories/payout.repository'
import { OrganisationService } from '../services/organisation.service'
import { MemberService } from '../services/member.service'
import { DashboardController } from '../controllers/dashboard.controller'
import { authenticate, requireOrgAccess } from '../middleware/auth.middleware'
import { paymentProvider } from '../providers'

const router = Router({ mergeParams: true })

const orgRepo = new OrganisationRepository()
const memberRepo = new MemberRepository()
const chargeRepo = new ChargeRepository()
const payoutRepo = new PayoutRepository()
const orgService = new OrganisationService(orgRepo, chargeRepo, payoutRepo)
const memberService = new MemberService(memberRepo, orgRepo, paymentProvider)
const dashboardController = new DashboardController(orgService, memberService)

router.use(authenticate)
router.use(requireOrgAccess)

router.get(
  '/:orgId/overview',
  (req, res, next) => dashboardController.getOverview(req, res, next)
)

export default router