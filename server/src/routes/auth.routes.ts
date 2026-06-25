import { Router } from 'express'
import { AdminRepository } from '../repositories/admin.repository'
import { AuthService } from '../services/auth.service'
import { AuthController } from '../controllers/auth.controllers'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

const adminRepository = new AdminRepository()
const authService = new AuthService(adminRepository)
const authController = new AuthController(authService)

router.post(
  '/register',
  (req, res, next) => authController.register(req, res, next)
)

router.post(
  '/login',
  (req, res, next) => authController.login(req, res, next)
)

router.post(
  '/refresh',
  (req, res, next) => authController.refresh(req, res, next)
)

router.post(
  '/logout',
  authenticate,
  (req, res, next) => authController.logout(req, res, next)
)

router.get(
  '/me',
  authenticate,
  (req, res, next) => authController.me(req, res, next)
)

export default router