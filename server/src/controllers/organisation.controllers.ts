import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { OrganisationService } from '../services/organisation.service'


const createOrgSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['ESTATE', 'COOPERATIVE', 'GYM', 'SCHOOL', 'CLINIC', 'OTHER']),
  adminWhatsapp: z.string().min(10),
  adminEmail: z.email().optional(),
  payoutBankAccount: z.string().min(10),
  payoutBankCode: z.string().min(3),
  payoutAccountName: z.string().min(2),
  payoutBankName: z.string().min(2),
  structure: z.enum(['FLAT', 'VARIABLE']).default('FLAT'),
})

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
})

const updatePayoutSchema = z.object({
  payoutBankAccount: z.string().min(10),
  payoutBankCode: z.string().min(3),
  payoutAccountName: z.string().min(2),
  payoutBankName: z.string().min(2),
})

export class OrganisationController {
  constructor(private readonly orgService: OrganisationService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createOrgSchema.parse(req.body)
      const org = await this.orgService.create({
        ...data,
        adminId: req.admin!.id
      })
      res.status(201).json({ success: true, data: org })
    } catch (error) {
      next(error)
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await this.orgService.getBySlug(req.params.slug as string)
      res.status(200).json({ success: true, data: org })
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await this.orgService.getById(req.params.orgId as string)
      res.status(200).json({ success: true, data: org })
    } catch (error) {
      next(error)
    }
  }

  async getMyOrgs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgs = await this.orgService.getByAdminId(req.admin!.id)
      res.status(200).json({ success: true, data: orgs })
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateOrgSchema.parse(req.body)
      const org = await this.orgService.update(req.params.orgId as string, data)
      res.status(200).json({ success: true, data: org })
    } catch (error) {
      next(error)
    }
  }

  async updatePayoutAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updatePayoutSchema.parse(req.body)
      const org = await this.orgService.update(req.params.orgId as string, data)
      res.status(200).json({ success: true, data: org })
    } catch (error) {
      next(error)
    }
  }

  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const balance = await this.orgService.getBalance(req.params.orgId as string)
      res.status(200).json({ success: true, data: balance })
    } catch (error) {
      next(error)
    }
  }

  async getInviteCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await this.orgService.getById(req.params.orgId as string)
      res.status(200).json({
        success: true,
        data: { inviteCode: org.inviteCode }
      })
    } catch (error) {
      next(error)
    }
  }
}