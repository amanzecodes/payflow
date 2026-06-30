import { Router } from 'express'
import { FeeLineController } from '../controllers/feeline.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()
const feeLineController = new FeeLineController()

router.use(authenticate)

router.post('/', (req, res, next) => feeLineController.create(req, res, next))

router.delete('/:feeLineId', (req, res, next) => feeLineController.delete(req, res, next))

export default router
