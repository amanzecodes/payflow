import { Router } from 'express'
import { CollectionRepository } from '../repositories/collection.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { CollectionService } from '../services/collection.service'
import { CollectionController } from '../controllers/collection.controller'
import { authenticate, requireOrgAccess } from '../middleware/auth.middleware'

const router = Router({ mergeParams: true })

const collectionRepo = new CollectionRepository()
const orgRepo = new OrganisationRepository()
const collectionService = new CollectionService(collectionRepo, orgRepo)
const collectionController = new CollectionController(collectionService)

router.use(authenticate)
router.use(requireOrgAccess)

// create collection
router.post(
  '/',
  (req, res, next) => collectionController.create(req, res, next)
)

// get all collections for org
router.get(
  '/',
  (req, res, next) => collectionController.getByOrg(req, res, next)
)

// get single collection
router.get(
  '/:collectionId',
  (req, res, next) => collectionController.getById(req, res, next)
)

// update collection
router.put(
  '/:collectionId',
  (req, res, next) => collectionController.update(req, res, next)
)

// get current cycle for a collection
router.get(
  '/:collectionId/current-cycle',
  (req, res, next) => collectionController.getCurrentCycle(req, res, next)
)

// get all cycles for a collection
router.get(
  '/:collectionId/cycles',
  (req, res, next) => collectionController.getAllCycles(req, res, next)
)

export default router