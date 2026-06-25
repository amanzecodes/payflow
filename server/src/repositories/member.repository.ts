import { Member, MemberStatus, Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export class MemberRepository {
  async findById(id: string): Promise<Member | null> {
    return prisma.member.findUnique({ where: { id } })
  }

  async findByAccountRef(accountRef: string): Promise<Member | null> {
    return prisma.member.findUnique({ where: { accountRef } })
  }

  async findAllByOrg(orgId: string): Promise<Member[]> {
    return prisma.member.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' }
    })
  }

  async findActiveByOrg(orgId: string): Promise<Member[]> {
    return prisma.member.findMany({
      where: { orgId, status: MemberStatus.ACTIVE },
      orderBy: { createdAt: 'asc' }
    })
  }

  async create(data: Prisma.MemberCreateInput): Promise<Member> {
    return prisma.member.create({ data })
  }

  async update(id: string, data: Prisma.MemberUpdateInput): Promise<Member> {
    return prisma.member.update({ where: { id }, data })
  }

  async markAccountSent(id: string): Promise<Member> {
    return prisma.member.update({
      where: { id },
      data: { accountSent: true }
    })
  }

  async deactivate(id: string): Promise<Member> {
    return prisma.member.update({
      where: { id },
      data: { status: MemberStatus.INACTIVE }
    })
  }
}