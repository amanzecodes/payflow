import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/auth.service'
import { setTokenCookies, clearTokenCookies, verifyRefreshToken } from '../lib/jwt'
import { AppError } from '../middleware/error.middleware'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string(),
})

const loginSchema = z.object({
  phone: z.string(),
  password: z.string().min(6),
})

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body)
      const { admin, tokens } = await this.authService.register(data)

      setTokenCookies(res, tokens)

      res.status(201).json({
        success: true,
        data: { admin }
      })
    } catch (error) {
      next(error)
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body)
      const { admin, tokens } = await this.authService.login(data)

      setTokenCookies(res, tokens)

      res.status(200).json({
        success: true,
        data: { admin }
      })
    } catch (error) {
      next(error)
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token
      if (!refreshToken) throw new AppError('No refresh token', 401)

      const tokens = await this.authService.refresh(refreshToken)
      setTokenCookies(res, tokens)

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed'
      })
    } catch (error) {
      next(error)
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearTokenCookies(res)
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = await this.authService.me(req.admin!.id)
      res.status(200).json({
        success: true,
        data: admin
      })
    } catch (error) {
      next(error)
    }
  }
}