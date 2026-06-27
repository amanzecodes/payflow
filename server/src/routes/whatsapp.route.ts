import { Router } from 'express'
import { WhatsAppController } from '../controllers/whatsapp.controller'

const router = Router()
const whatsappController = new WhatsAppController()

router.post(
  '/incoming',
  (req, res, next) => whatsappController.handleIncoming(req, res, next)
)

export default router