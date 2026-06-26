import { Member } from '../generated/prisma/client'
import { MemberRepository } from '../repositories/member.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { PaymentProvider } from '../providers/PaymentProviders'
import { AppError } from '../middleware/error.middleware'

export class MemberService {
  constructor(
    private readonly memberRepo: MemberRepository,
    private readonly orgRepo: OrganisationRepository,
    private readonly paymentProvider: PaymentProvider
  ) {}

  async create(data: {
    orgId: string
    name: string
    identifier: string
    phone?: string
    expectedAmount: number
  }): Promise<Member> {
    const org = await this.orgRepo.findById(data.orgId)
    if (!org) throw new AppError('Organisation not found', 404)

    const { createId } = await import('@paralleldrive/cuid2')
    const memberId = createId()
    const accountRef = `${data.orgId}:${memberId}`

    const { accountNumber, bankName } = await this.paymentProvider.createVirtualAccount(
      accountRef,
      data.name,
      data.expectedAmount
    )

    return this.memberRepo.create({
      id: memberId,
      name: data.name,
      identifier: data.identifier,
      phone: data.phone,
      vaNumber: accountNumber,
      vaBankName: bankName,
      accountRef,
      expectedAmount: data.expectedAmount,
      accountSent: false,
      org: { connect: { id: data.orgId } }
    })
  }

  async getAllByOrg(orgId: string): Promise<Member[]> {
    return this.memberRepo.findAllByOrg(orgId)
  }

  async getById(id: string): Promise<Member> {
    const member = await this.memberRepo.findById(id)
    if (!member) throw new AppError('Member not found', 404)
    return member
  }

  async getByAccountRef(accountRef: string): Promise<Member> {
    const member = await this.memberRepo.findByAccountRef(accountRef)
    if (!member) throw new AppError('Member not found for this account ref', 404)
    return member
  }

  async update(id: string, data: Partial<{
    name: string
    identifier: string
    phone: string
  }>): Promise<Member> {
    await this.getById(id)
    return this.memberRepo.update(id, data)
  }

  async deactivate(id: string): Promise<Member> {
    await this.getById(id)
    return this.memberRepo.deactivate(id)
  }

  async markAccountSent(id: string): Promise<Member> {
    await this.getById(id)
    return this.memberRepo.markAccountSent(id)
  }

  formatAccountCard(member: Member): string {
    return [
      `👤 ${member.name} — ${member.identifier}`,
      `🏦 ${member.vaBankName}`,
      `🔢 ${member.vaNumber}`,
      `💰 Accepts exactly ₦${member.expectedAmount.toLocaleString()}`,
      `_Pay into this account each cycle — logs automatically._`
    ].join('\n')
  }
}