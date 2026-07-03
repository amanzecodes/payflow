import { Router } from 'express'
import { WebhookRepository } from '../repositories/webhook.repository'
import { MemberRepository } from '../repositories/member.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { WebhookService } from '../services/webhook.service'
import { WebhookController } from '../controllers/webhook.controller'

const router = Router()

const webhookRepo = new WebhookRepository()
const memberRepo = new MemberRepository()
const chargeRepo = new ChargeRepository()
const webhookService = new WebhookService(webhookRepo, memberRepo, chargeRepo)
const webhookController = new WebhookController(webhookService)


router.post(
  '/nomba',
  (req, res) => webhookController.handleNomba(req, res)
)

export default router