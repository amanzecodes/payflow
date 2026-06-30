import { Router } from 'express'
import { BanksController } from '../controllers/banks.controller'

const router = Router()
const banksController = new BanksController()

// No auth required for bank list
router.get('/list', (req, res, next) => banksController.list(req, res, next))

// No auth required for account verification
router.post('/verify', (req, res, next) => banksController.verify(req, res, next))

export default router
