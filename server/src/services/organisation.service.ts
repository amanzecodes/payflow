import { Organisation, OrgType, CollectionStructure } from '../generated/prisma/client'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PayoutRepository } from '../repositories/payout.repository'
import { AppError } from '../middleware/error.middleware'
import { OrgBalance } from '../types'

export class OrganisationService {
  constructor(
    private readonly orgRepo: OrganisationRepository,
    private readonly chargeRepo: ChargeRepository,
    private readonly payoutRepo: PayoutRepository
  ) {}

  async create(data: {
    name: string
    type: OrgType
    adminId: string
    adminWhatsapp: string
    adminEmail?: string
    payoutBankAccount: string
    payoutBankCode: string
    payoutAccountName: string
    payoutBankName: string
    structure: CollectionStructure
  }): Promise<Organisation> {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const existing = await this.orgRepo.findBySlug(slug)
    if (existing) throw new AppError('Organisation with this name already exists', 409)

    const inviteCode = data.structure === 'VARIABLE'
      ? `JOIN-${slug}-${Date.now().toString(36)}`
      : undefined

    return this.orgRepo.create({
      name: data.name,
      type: data.type,
      slug,
      adminWhatsapp: data.adminWhatsapp,
      adminEmail: data.adminEmail,
      payoutBankAccount: data.payoutBankAccount,
      payoutBankCode: data.payoutBankCode,
      payoutAccountName: data.payoutAccountName,
      payoutBankName: data.payoutBankName,
      structure: data.structure,
      inviteCode,
      admin: { connect: { id: data.adminId } }
    })
  }

  async getBySlug(slug: string): Promise<Organisation> {
    const org = await this.orgRepo.findBySlug(slug)
    if (!org) throw new AppError('Organisation not found', 404)
    return org
  }

  async getById(id: string): Promise<Organisation> {
    const org = await this.orgRepo.findById(id)
    if (!org) throw new AppError('Organisation not found', 404)
    return org
  }

  async getByAdminId(adminId: string): Promise<Organisation[]> {
    return this.orgRepo.findAllByAdmin(adminId)
  }

  async getByWhatsapp(phone: string): Promise<Organisation | null> {
    return this.orgRepo.findByWhatsapp(phone)
  }

  async getByInviteCode(inviteCode: string): Promise<Organisation> {
    const org = await this.orgRepo.findByInviteCode(inviteCode)
    if (!org) throw new AppError('Invalid invite code', 404)
    return org
  }

  async update(id: string, data: Partial<{
    name: string
    payoutBankAccount: string
    payoutBankCode: string
    payoutAccountName: string
    payoutBankName: string
  }>): Promise<Organisation> {
    await this.getById(id)
    return this.orgRepo.update(id, data)
  }

  async getBalance(orgId: string): Promise<OrgBalance> {
    await this.getById(orgId)

    const [totalCollected, totalPayouts] = await Promise.all([
      this.chargeRepo.getTotalPaidByOrg(orgId),
      this.payoutRepo.getTotalCompletedByOrg(orgId)
    ])

    return {
      totalCollected,
      totalPayouts,
      available: totalCollected - totalPayouts
    }
  }
}