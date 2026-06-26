import { Router } from 'express'
import { MemberRepository } from '../repositories/member.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { MemberService } from '../services/member.service'
import { MemberController } from '../controllers/member.controller'
import { authenticate, requireOrgAccess } from '../middleware/auth.middleware'
import { paymentProvider } from '../providers'

const router = Router({ mergeParams: true })

const memberRepo = new MemberRepository()
const orgRepo = new OrganisationRepository()
const memberService = new MemberService(memberRepo, orgRepo, paymentProvider)
const memberController = new MemberController(memberService)

router.use(authenticate)
router.use(requireOrgAccess)

router.get(
  '/',
  (req, res, next) => memberController.getAllByOrg(req, res, next)
)

router.post(
  '/',
  (req, res, next) => memberController.create(req, res, next)
)

router.get(
  '/:memberId',
  (req, res, next) => memberController.getById(req, res, next)
)

router.patch(
  '/:memberId/deactivate',
  (req, res, next) => memberController.deactivate(req, res, next)
)

router.patch(
  '/:memberId/account-sent',
  (req, res, next) => memberController.markAccountSent(req, res, next)
)

router.get(
  '/:memberId/account-card',
  (req, res, next) => memberController.getAccountCard(req, res, next)
)

export default router