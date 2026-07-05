import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { FeeLineService } from '../services/feeline.service'

const createFeeLineSchema = z.object({
  collectionId: z.string().min(1),
  name: z.string().min(2),
  amount: z.number().positive('Amount must be greater than zero'),
})

export class FeeLineController {
  private service = new FeeLineService()

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { collectionId, name, amount } = createFeeLineSchema.parse(req.body)
      const adminId = typeof req.admin!.id === 'string' ? req.admin!.id : req.admin!.id[0]
      const feeLine = await this.service.createFeeLine(collectionId, name, amount, adminId)
      res.status(201).json({ success: true, data: feeLine })
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const feeLineId = req.params.feeLineId as string
      const adminId = typeof req.admin!.id === 'string' ? req.admin!.id : req.admin!.id[0]
      await this.service.deleteFeeLine(feeLineId, adminId)
      res.status(200).json({ success: true, message: 'Fee line deleted' })
    } catch (error) {
      next(error)
    }
  }
}
