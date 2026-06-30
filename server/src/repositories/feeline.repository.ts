import { prisma } from '../lib/prisma'

export class FeeLineRepository {
  async findById(id: string) {
    return prisma.feeLine.findUnique({
      where: { id },
      include: { collection: { include: { org: true } } },
    })
  }

  async findByCollectionId(collectionId: string) {
    return prisma.feeLine.findMany({
      where: { collectionId },
    })
  }

  async create(data: { collectionId: string; name: string; amount: number }) {
    return prisma.feeLine.create({
      data: {
        name: data.name,
        amount: data.amount,
        collection: { connect: { id: data.collectionId } },
      },
    })
  }

  async delete(id: string) {
    return prisma.feeLine.delete({ where: { id } })
  }
}
