import { Admin, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class AdminRepository {
  async findById(id: string): Promise<Admin | null> {
    return prisma.admin.findUnique({ where: { id } })
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return prisma.admin.findUnique({ where: { email } })
  }

  async findByPhone(phone: string): Promise<Admin | null> {
    return prisma.admin.findUnique({ where: { phone } })
  }

  async create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return prisma.admin.create({ data })
  }


  async update(id: string, data: Prisma.AdminUpdateInput): Promise<Admin> {
    return prisma.admin.update({ where: { id }, data })
  }

  async getOrganisationsByAdminId(adminId: string) {
    return prisma.organisation.findMany({
      where: { adminId }
    })
  }
}