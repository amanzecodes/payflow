import { Router } from 'express'
import { BanksController } from '../controllers/banks.controller'

const router = Router()
const banksController = new BanksController()


router.get('/list', (req, res, next) => banksController.list(req, res, next))


router.post('/verify', (req, res, next) => banksController.verify(req, res, next))

export default router
