import { Organisation, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class OrganisationRepository {
  async findById(id: string): Promise<Organisation | null> {
    return prisma.organisation.findUnique({ where: { id } })
  }

  async findBySlug(slug: string): Promise<Organisation | null> {
    return prisma.organisation.findUnique({ where: { slug } })
  }

  async findByWhatsapp(phone: string): Promise<Organisation | null> {
    return prisma.organisation.findUnique({ where: { adminWhatsapp: phone } })
  }

  async findByInviteCode(inviteCode: string): Promise<Organisation | null> {
    return prisma.organisation.findUnique({ where: { inviteCode } })
  }

  async findAllByAdmin(adminId: string): Promise<Organisation[]> {
    return prisma.organisation.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async create(data: Prisma.OrganisationCreateInput): Promise<Organisation> {
    return prisma.organisation.create({ data })
  }

  async update(id: string, data: Prisma.OrganisationUpdateInput): Promise<Organisation> {
    return prisma.organisation.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.organisation.delete({ where: { id } })
  }
}