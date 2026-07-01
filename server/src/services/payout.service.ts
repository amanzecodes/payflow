import { PayoutRepository } from '../repositories/payout.repository'
import { OrganisationRepository } from '../repositories/organisation.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { PaymentProvider } from '../providers/PaymentProviders'
import { AppError } from '../middleware/error.middleware'
import { logger } from '../lib/logger'
import { Payout } from '../generated/prisma/client'
import { PayoutPageData } from '../types'



export class PayoutService {
  constructor(
    private readonly payoutRepo: PayoutRepository,
    private readonly orgRepo: OrganisationRepository,
    private readonly chargeRepo: ChargeRepository,
    private readonly paymentProvider: PaymentProvider
  ) {}

  async requestPayout(orgId: string, amount: number): Promise<Payout> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new AppError('Organisation not found', 404)

    const totalCollected = await this.chargeRepo.getTotalPaidByOrg(orgId)
    const totalPayouts = await this.payoutRepo.getTotalCompletedByOrg(orgId)
    const available = totalCollected - totalPayouts

    logger.info(
      `[PayoutService] Payout request — org: ${org.name}, requested: ₦${amount}, available: ₦${available}`
    )

    if (amount <= 0) {
      throw new AppError('Payout amount must be greater than zero', 400)
    }

    if (amount > available) {
      throw new AppError(
        `Insufficient balance. Available: ₦${available.toLocaleString()}, Requested: ₦${amount.toLocaleString()}`,
        400
      )
    }

    const payout = await this.payoutRepo.create({
      amount,
      status: 'PENDING',
      bankAccount: org.payoutBankAccount,
      bankCode: org.payoutBankCode,
      bankName: org.payoutBankName,
      org: { connect: { id: orgId } }
    })

    try {
      const { transferRef } = await this.paymentProvider.transferToBank(
        amount,
        org.payoutBankAccount,
        org.payoutBankCode
      )

      const completed = await this.payoutRepo.markCompleted(payout.id, transferRef)

      logger.info(
        `[PayoutService] Payout completed — ₦${amount} to ${org.payoutBankName} ••${org.payoutBankAccount.slice(-4)}, ref: ${transferRef}`
      )

      return completed
    } catch (error) {
      await this.payoutRepo.markFailed(payout.id)
      logger.error(`[PayoutService] Payout failed for org ${orgId}: ${error}`)
      throw new AppError('Payout failed — please try again or contact support', 500)
    }
  }

  async getAllByOrg(orgId: string): Promise<Payout[]> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new AppError('Organisation not found', 404)
    return this.payoutRepo.findAllByOrg(orgId)
  }

  async getById(id: string): Promise<Payout> {
    const payout = await this.payoutRepo.findById(id)
    if (!payout) throw new AppError('Payout not found', 404)
    return payout
  }

  async getAvailableBalance(orgId: string): Promise<{
    totalCollected: number
    totalPayouts: number
    available: number
  }> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new AppError('Organisation not found', 404)

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

  async getPayoutPage(orgId: string): Promise<PayoutPageData> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) throw new AppError('Organisation not found', 404)

    const [balance, payouts] = await Promise.all([
      this.getAvailableBalance(orgId),
      this.payoutRepo.findAllByOrg(orgId)
    ])

    return {
      balance,
      payouts,
      payoutDestination: {
        bankName: org.payoutBankName,
        bankAccount: org.payoutBankAccount,
        last4: org.payoutBankAccount.slice(-4)
      }
    }
  }
}