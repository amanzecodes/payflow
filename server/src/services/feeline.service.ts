import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { FeeLineRepository } from '../repositories/feeline.repository'

export class FeeLineService {
  private repository = new FeeLineRepository()

  async createFeeLine(
    collectionId: string,
    name: string,
    amount: number,
    adminId: string
  ) {
    // Verify collection exists and admin owns it
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: { org: true },
    })

    if (!collection) {
      throw new AppError('Collection not found', 404)
    }

    if (collection.org.adminId !== adminId) {
      throw new AppError('Unauthorized', 403)
    }

    return this.repository.create({ collectionId, name, amount })
  }

  async deleteFeeLine(feeLineId: string, adminId: string) {
    const feeLine = await this.repository.findById(feeLineId)

    if (!feeLine) {
      throw new AppError('Fee line not found', 404)
    }

    if (feeLine.collection.org.adminId !== adminId) {
      throw new AppError('Unauthorized', 403)
    }

    return this.repository.delete(feeLineId)
  }
}
