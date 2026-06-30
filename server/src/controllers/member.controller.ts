import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { MemberService } from '../services/member.service'

const createMemberSchema = z.object({
  name: z.string().min(2),
  identifier: z.string().min(1),
  phone: z.string().optional(),
  expectedAmount: z.number().positive(),
})

// const enrollSchema = z.object({
//   feeLineIds: z.array(z.string()).min(1)
// })

export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createMemberSchema.parse(req.body)
      const member = await this.memberService.create({
        orgId: req.params.orgId as string,
        ...data
      })
      res.status(201).json({ success: true, data: member })
    } catch (error) {
      next(error)
    }
  }

  async getAllByOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await this.memberService.getAllByOrgWithChargeStatus(req.params.orgId as string)
      res.status(200).json({ success: true, data: members })
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await this.memberService.getById(req.params.memberId as string)
      res.status(200).json({ success: true, data: member })
    } catch (error) {
      next(error)
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await this.memberService.deactivate(req.params.memberId as string)
      res.status(200).json({ success: true, data: member })
    } catch (error) {
      next(error)
    }
  }

  async markAccountSent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await this.memberService.markAccountSent(req.params.memberId as string)
      res.status(200).json({ success: true, data: member })
    } catch (error) {
      next(error)
    }
  }

  async getAccountCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await this.memberService.getById(req.params.memberId as string)
      const card = this.memberService.formatAccountCard(member)
      res.status(200).json({ success: true, data: { card, member } })
    } catch (error) {
      next(error)
    }
  }
}