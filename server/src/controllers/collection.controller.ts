import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { CollectionService } from '../services/collection.service'

const createCollectionSchema = z.object({
  name: z.string().min(2, 'Collection name must be at least 2 characters'),
  amount: z.number().positive('Amount must be greater than zero').optional(),
  cycle: z.enum(['MONTHLY', 'YEARLY', 'ONE_TIME', 'CUSTOM']),
  dueDate: z.coerce.date().optional(),
})

const updateCollectionSchema = z.object({
  name: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
})

export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createCollectionSchema.parse(req.body)
      const collection = await this.collectionService.create({
        orgId: req.params.orgId as string,
        ...data
      })
      res.status(201).json({ success: true, data: collection })
    } catch (error) {
      next(error)
    }
  }

  async getByOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const collections = await this.collectionService.getByOrg(req.params.orgId as string)
      res.status(200).json({ success: true, data: collections })
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const collection = await this.collectionService.getById(req.params.collectionId as string)
      res.status(200).json({ success: true, data: collection })
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateCollectionSchema.parse(req.body)
      const collection = await this.collectionService.update(req.params.collectionId as string, data)
      res.status(200).json({ success: true, data: collection })
    } catch (error) {
      next(error)
    }
  }

   async getCurrentCycle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cycle = await this.collectionService.getCurrentCycle(
        req.params.collectionId as string
      )
      res.status(200).json({ success: true, data: cycle })
    } catch (error) {
      next(error)
    }
  }

  async getAllCycles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cycles = await this.collectionService.getAllCycles(
        req.params.collectionId as string
      )
      res.status(200).json({ success: true, data: cycles })
    } catch (error) {
      next(error)
    }
  }

}