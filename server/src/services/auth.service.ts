import bcrypt from 'bcryptjs'
import { Admin, Organisation } from '../generated/prisma/client'
import { AdminRepository } from '../repositories/admin.repository'
import { AppError } from '../middleware/error.middleware'
import { generateTokens, verifyRefreshToken } from '../lib/jwt'
import { AuthTokens, JwtPayload } from '../types'

type SafeAdmin = Omit<Admin, 'password'>

export class AuthService {
  constructor(private readonly adminRepo: AdminRepository) {}

  async register(data: {
    name: string
    email: string
    password: string
    phone: string
  }): Promise<{ admin: SafeAdmin; tokens: AuthTokens; organisations: Organisation[] }> {

    const existing = await this.adminRepo.findByEmail(data.email)
    if (existing) {
      throw new AppError('An account with this email already exists', 409)
    }

    // check phone not already taken
    if (data.phone) {
      const existingPhone = await this.adminRepo.findByPhone(data.phone)
      if (existingPhone) {
        throw new AppError('An account with this phone number already exists', 409)
      }
    }

    // hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // create admin
    const admin = await this.adminRepo.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
    })

    // generate tokens
    const payload: JwtPayload = { adminId: admin.id, email: admin.email, phone: admin.phone }
    const tokens = generateTokens(payload)
    const organisations = await this.adminRepo.getOrganisationsByAdminId(admin.id)

    return {
      admin: this.sanitize(admin),
      tokens,
      organisations
    }
  }

    async login(data: {
    phone: string
    password: string
  }): Promise<{ admin: SafeAdmin; tokens: AuthTokens; organisations: Organisation[] }> {
    const admin = await this.adminRepo.findByPhone(data.phone)
    if (!admin) throw new AppError('Invalid phone number or password', 401)

    const isValid = await bcrypt.compare(data.password, admin.password)
    if (!isValid) throw new AppError('Invalid phone number or password', 401)

    const tokens = generateTokens({ adminId: admin.id, email: admin.email, phone: admin.phone })
    const organisations = await this.adminRepo.getOrganisationsByAdminId(admin.id)

    return { admin: this.sanitize(admin), tokens, organisations }
  }

  async getAdminWithOrganisations(adminId: string) {
    const admin = await this.adminRepo.findById(adminId)
    if (!admin) throw new AppError('Admin not found', 404)

    const organisations = await this.adminRepo.getOrganisationsByAdminId(adminId)

    return { admin: this.sanitize(admin), organisations }
  }

async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = verifyRefreshToken(refreshToken)
      return generateTokens({ adminId: payload.adminId, email: payload.email, phone: payload.phone })
    } catch {
      throw new AppError('Invalid or expired refresh token', 401)
    }
  }

  async me(adminId: string): Promise<SafeAdmin> {
    const admin = await this.adminRepo.findById(adminId)
    if (!admin) throw new AppError('Admin not found', 404)
    return this.sanitize(admin)
  }

  private sanitize(admin: Admin): SafeAdmin {
    const { password, ...safe } = admin
    return safe
  }
}