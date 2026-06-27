import { Collection, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class CollectionRepository {
  async findById(id: string): Promise<Collection | null> {
    return prisma.collection.findUnique({ where: { id } })
  }

  async findAllByOrg(orgId: string): Promise<Collection[]> {
    return prisma.collection.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async create(data: Prisma.CollectionCreateInput): Promise<Collection> {
    return prisma.collection.create({ data })
  }

  async update(id: string, data: Prisma.CollectionUpdateInput): Promise<Collection> {
    return prisma.collection.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.collection.delete({ where: { id } })
  }
}