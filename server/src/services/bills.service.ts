import { Payout, PayoutStatus, PayoutType } from '../generated/prisma/client'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PayoutRepository } from '../repositories/payout.repository'
import { AppError } from '../middleware/error.middleware'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'
import { PaymentProvider } from '../providers/PaymentProviders';


const VALID_NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE'] as const
type Network = typeof VALID_NETWORKS[number]

export class BillsService {
  constructor(
    private readonly orgRepo: OrganisationRepository,
    private readonly chargeRepo: ChargeRepository,
    private readonly payoutRepo: PayoutRepository,
    private readonly paymentProvider: PaymentProvider
  ) {}


  private async checkBalance(orgId: string, amount: number): Promise<void> {
    const [totalCollected, totalPayouts] = await Promise.all([
      this.chargeRepo.getTotalPaidByOrg(orgId),
      this.payoutRepo.getTotalCompletedByOrg(orgId)
    ])

    const available = totalCollected - totalPayouts

    if (amount <= 0) {
      throw new AppError('Amount must be greater than zero', 400)
    }

    if (amount > available) {
      throw new AppError(
        `Insufficient balance. Available: ₦${available.toLocaleString()}, Requested: ₦${amount.toLocaleString()}`,
        400
      )
    }
  }

  private validateNetwork(network: string): Network {
    const upper = network.toUpperCase() as Network
    if (!VALID_NETWORKS.includes(upper)) {
      throw new AppError(
        `Invalid network. Must be one of: ${VALID_NETWORKS.join(', ')}`,
        400
      )
    }
    return upper
  }

  private validatePhone(phone: string): string {
    const cleaned = phone.replace(/\s/g, '')

    const regex = /^(\+234|0)[0-9]{10}$/
    if (!regex.test(cleaned)) {
      throw new AppError(
        'Invalid phone number. Use format: 08012345678 or +2348012345678',
        400
      )
    }

    return cleaned.startsWith('+234')
      ? '0' + cleaned.slice(4)
      : cleaned
  }


  async vendAirtime(
    orgId: string,
    phoneNumber: string,
    network: string,
    amount: number
  ): Promise<Payout> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new AppError('Organisation not found', 404)

    
    const validNetwork = this.validateNetwork(network)
    const validPhone = this.validatePhone(phoneNumber)

    // Nomba airtime limits
    if (amount < 50) {
      throw new AppError('Minimum airtime amount is ₦50', 400)
    }
    if (amount > 50000) {
      throw new AppError('Maximum airtime amount is ₦50,000', 400)
    }

    
    await this.checkBalance(orgId, amount)

    logger.info(
      `[BillsService] Airtime request — org: ${org.name}, phone: ${validPhone}, network: ${validNetwork}, amount: ₦${amount}`
    )

    // call Nomba airtime API
    const result = await this.paymentProvider.vendAirtime(
      validPhone,
      validNetwork,
      amount
    )

    const payout = await prisma.payout.create({
      data: {
        amount,
        status: PayoutStatus.COMPLETED,
        type: PayoutType.AIRTIME,
        bankAccount: '',
        bankCode: '',
        bankName: '',
        transferRef: result.merchantTxRef,
        completedAt: new Date(),
        metadata: {
          phoneNumber: validPhone,
          network: validNetwork,
          rrn: result.rrn,
          merchantTxRef: result.merchantTxRef,
          nombaStatus: result.status
        },
        org: { connect: { id: orgId } }
      }
    })

    logger.info(
      `[BillsService] Airtime vended — org: ${org.name}, phone: ${validPhone}, network: ${validNetwork}, amount: ₦${amount}, ref: ${result.merchantTxRef}`
    )

    return payout
  }

  async getBillsHistory(orgId: string): Promise<object[]> {
  const org = await this.orgRepo.findById(orgId)
  if (!org) throw new AppError('Organisation not found', 404)

  const bills = await prisma.payout.findMany({
    where: {
      orgId,
      type: { in: ['AIRTIME', 'DATA', 'ELECTRICITY', 'CABLETV'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  return bills.map(bill => {
    const meta = bill.metadata as {
      phoneNumber?: string
      network?: string
      disco?: string
      meterNumber?: string
      rrn?: string
      merchantTxRef?: string
    } | null

    return {
      id: bill.id,
      type: bill.type,                    // AIRTIME | DATA | ELECTRICITY
      amount: bill.amount,
      status: bill.status,                // COMPLETED | PENDING | FAILED
      reference: bill.transferRef,
      createdAt: bill.createdAt,
      // bill-specific fields from metadata
      phoneNumber: meta?.phoneNumber ?? null,
      network: meta?.network ?? null,
      disco: meta?.disco ?? null,         // for electricity
      meterNumber: meta?.meterNumber ?? null  // for electricity
    }
  })
}
}