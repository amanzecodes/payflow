import { Router } from 'express'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PayoutRepository } from '../repositories/payout.repository'
import { OrganisationService } from '../services/organisation.service'
import { OrganisationController } from '../controllers/organisation.controllers'
import { authenticate, requireOrgAccess } from '../middleware/auth.middleware'

const router = Router()

const orgRepo = new OrganisationRepository()
const chargeRepo = new ChargeRepository()
const payoutRepo = new PayoutRepository()
const orgService = new OrganisationService(orgRepo, chargeRepo, payoutRepo)
const orgController = new OrganisationController(orgService)

// all routes require authentication
router.use(authenticate)

// get all orgs for logged in admin
router.get(
  '/my-orgs',
  (req, res, next) => orgController.getMyOrgs(req, res, next)
)

// create org
router.post(
  '/',
  (req, res, next) => orgController.create(req, res, next)
)

// get by slug
router.get(
  '/slug/:slug',
  (req, res, next) => orgController.getBySlug(req, res, next)
)

// routes below require org ownership
router.get(
  '/:orgId',
  requireOrgAccess,
  (req, res, next) => orgController.getById(req, res, next)
)

router.put(
  '/:orgId',
  requireOrgAccess,
  (req, res, next) => orgController.update(req, res, next)
)

router.put(
  '/:orgId/payout-account',
  requireOrgAccess,
  (req, res, next) => orgController.updatePayoutAccount(req, res, next)
)

router.get(
  '/:orgId/balance',
  requireOrgAccess,
  (req, res, next) => orgController.getBalance(req, res, next)
)

router.get(
  '/:orgId/invite-code',
  requireOrgAccess,
  (req, res, next) => orgController.getInviteCode(req, res, next)
)

export default router