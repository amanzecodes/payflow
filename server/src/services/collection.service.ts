import { Collection, CycleFrequency } from '../generated/prisma/client'
import { CollectionRepository } from '../repositories/collection.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { AppError } from '../middleware/error.middleware'
import { prisma } from '../lib/prisma'
import { format, endOfMonth, endOfQuarter, endOfYear, addYears } from 'date-fns'

export class CollectionService {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly orgRepo: OrganisationRepository
  ) {}

  async create(data: {
    orgId: string
    name: string
    amount?: number
    cycle: string
  }): Promise<Collection> {
    const org = await this.orgRepo.findById(data.orgId)
    if (!org) throw new AppError('Organisation not found', 404)

    const existing = await this.collectionRepo.findAllByOrg(data.orgId)
    const duplicate = existing.find(
      c => c.name.toLowerCase() === data.name.toLowerCase()
    )
    if (duplicate) throw new AppError('A collection with this name already exists', 409)

    const collection = await this.collectionRepo.create({
      name: data.name,
      amount: data.amount,
      cycle: data.cycle as CycleFrequency,
      org: { connect: { id: data.orgId } }
    })

    await this.openCurrentCycle(collection.id, data.cycle as CycleFrequency)

    return collection
  }

  private async openCurrentCycle(
    collectionId: string,
    frequency: CycleFrequency
  ): Promise<void> {
    const now = new Date()
    let period: string
    let dueDate: Date

    switch (frequency) {
      case CycleFrequency.MONTHLY:
        period = format(now, 'yyyy-MM')
        dueDate = endOfMonth(now)
        break

      case CycleFrequency.QUARTERLY:
        period = `${format(now, 'yyyy')}-Q${Math.ceil((now.getMonth() + 1) / 3)}`
        dueDate = endOfQuarter(now)
        break

      case CycleFrequency.YEARLY:
        period = format(now, 'yyyy')
        dueDate = endOfYear(now)
        break

      case CycleFrequency.TERMLY:
        // termly opened manually by admin
        return

      case CycleFrequency.ONE_TIME: {
        // check if a cycle already exists — never open more than one
        const existing = await prisma.cycle.findFirst({
          where: { collectionId }
        })
        if (existing) return

        // open one cycle with a far future due date — effectively never expires
        await prisma.cycle.create({
          data: {
            collectionId,
            period: 'ONE-TIME',
            dueDate: addYears(now, 1)
          }
        })
        return
      }

      default:
        return
    }

    // for recurring cycles — check it does not already exist
    const existing = await prisma.cycle.findUnique({
      where: { collectionId_period: { collectionId, period } }
    })
    if (existing) return

    await prisma.cycle.create({
      data: { collectionId, period, dueDate }
    })
  }

  async getByOrg(orgId: string): Promise<Collection[]> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new AppError('Organisation not found', 404)
    return this.collectionRepo.findAllByOrg(orgId)
  }

  async getById(id: string): Promise<Collection> {
    const collection = await this.collectionRepo.findById(id)
    if (!collection) throw new AppError('Collection not found', 404)
    return collection
  }

  async update(id: string, data: Partial<{
    name: string
    amount: number
  }>): Promise<Collection> {
    await this.getById(id)
    return this.collectionRepo.update(id, data)
  }

  async getCurrentCycle(collectionId: string) {
    return prisma.cycle.findFirst({
      where: {
        collectionId,
        dueDate: { gt: new Date() }
      },
      orderBy: { openedAt: 'desc' },
      include: {
        charges: {
          include: { member: true }
        }
      }
    })
  }

  async getAllCycles(collectionId: string) {
    return prisma.cycle.findMany({
      where: { collectionId },
      orderBy: { openedAt: 'desc' },
      include: {
        _count: {
          select: { charges: true }
        }
      }
    })
  }
}