import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { AdminRepository } from '../repositories/admin.repository'
import { AppError } from './error.middleware'
import { prisma } from '../lib/prisma'

const adminRepo = new AdminRepository()

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // read token from cookie first, fall back to Authorization header
    const token = req.cookies?.access_token ||
      req.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new AppError('No token provided', 401)
    }

    const payload = verifyAccessToken(token)

    const admin = await adminRepo.findById(payload.adminId)
    if (!admin) {
      throw new AppError('Admin not found', 401)
    }

    const { password, ...safeAdmin } = admin
    req.admin = safeAdmin

    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }
    next(new AppError('Invalid or expired token', 401))
  }
}

export async function requireOrgAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.params.orgId as string | undefined
    const slug = req.params.slug as string | undefined
    const adminId = req.admin?.id

    if (!adminId) throw new AppError('Unauthorized', 401)

    const org = await prisma.organisation.findFirst({
      where: {
        AND: [
          { adminId },
          orgId ? { id: orgId } : { slug }
        ]
      }
    })

    if (!org) throw new AppError('Organisation not found or access denied', 403)

    req.org = org
    next()
  } catch (error) {
    next(error)
  }
}