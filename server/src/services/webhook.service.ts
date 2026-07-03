import { Prisma, WebhookReconciliationStatus } from '../generated/prisma/client'
import { NombaWebhookPayload } from '../providers/PaymentProviders'
import { WebhookRepository } from '../repositories/webhook.repository'
import { MemberRepository } from '../repositories/member.repository'
import { ChargeRepository } from '../repositories/charge.repository'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'
import { getIO } from '../lib/socket'
import { paymentProvider } from '../providers'
import { sendWhatsAppMessage } from '../lib/twilio'

export class WebhookService {
  constructor(
    private readonly webhookRepo: WebhookRepository,
    private readonly memberRepo: MemberRepository,
    private readonly chargeRepo: ChargeRepository
  ) {}

  async processNombaWebhook(payload: NombaWebhookPayload): Promise<void> {
    const { event_type, requestId, data } = payload

    // 1. write raw event to db immediately — before any processing
    const event = await this.webhookRepo.create({
      eventType: event_type,
      accountRef: data?.transaction?.aliasAccountNumber,
      txRef: data?.transaction?.transactionId,
      amount: data?.transaction?.transactionAmount,
      payload: payload as unknown as Prisma.InputJsonValue,
      processed: false,
    })

    logger.info(
      `[WebhookService] Received ${event_type} — requestId: ${requestId}, txId: ${data?.transaction?.transactionId}, amount: ₦${data?.transaction?.transactionAmount}`
    )

    switch (event_type) {
      case 'payment_success':
        if (data?.transaction?.aliasAccountType === 'VIRTUAL') {
          await this.handlePaymentSuccess(event.id, payload)
        } else {
          logger.info(
            `[WebhookService] Ignored non-virtual payment_success — type: ${data?.transaction?.type}`
          )
          await this.webhookRepo.markProcessed(event.id)
        }
        break

      case 'payout_success':
        await this.handlePayoutSuccess(event.id, payload)
        break

      case 'payout_refund':
        await this.handlePayoutRefund(event.id, payload)
        break

      case 'payment_failed':
        logger.info(
          `[WebhookService] Payment failed — txId: ${data?.transaction?.transactionId}`
        )
        await this.webhookRepo.markProcessedWithStatus(
          event.id,
          WebhookReconciliationStatus.PAYMENT_FAILED
        )
        break

      default:
        logger.info(
          `[WebhookService] Unknown event type: ${event_type} — marking processed`
        )
        await this.webhookRepo.markProcessed(event.id)
    }
  }

  

  private async handlePaymentSuccess(
    eventId: string,
    payload: NombaWebhookPayload
  ): Promise<void> {
    const { data } = payload
    const { transaction, customer } = data


    const alreadyProcessed = await this.webhookRepo.isProcessed(
      transaction.transactionId,
      eventId
    )

    if (alreadyProcessed) {
      logger.info(
        `[WebhookService] Duplicate webhook ignored — txId: ${transaction.transactionId}`
      )
      return
    }

    
    const member = await this.memberRepo.findByVaNumber(
      transaction.aliasAccountNumber!
    )

    if (!member) {
      logger.warn(
        `[WebhookService] No member found for VA: ${transaction.aliasAccountNumber}`
      )
      await this.webhookRepo.markProcessed(eventId)
      return
    }

    
    const charge = await this.chargeRepo.findPendingByMember(member.id)

    if (!charge) {
      logger.warn(
        `[WebhookService] No pending charge for member: ${member.id} (${member.name})`
      )
      await this.webhookRepo.markProcessed(eventId)
      return
    }

    const receivedAmount = transaction.transactionAmount
    const expectedAmount = charge.amount
    const paidSoFar = charge.paidSoFar || 0
    const newPaidSoFar = paidSoFar + receivedAmount
    const stillOwed = expectedAmount - newPaidSoFar

   
    if (newPaidSoFar < expectedAmount) {
      logger.warn(
        `[WebhookService] UNDERPAYMENT — member: ${member.name}, expected: ₦${expectedAmount}, paid so far: ₦${newPaidSoFar}, still owed: ₦${stillOwed}`
      )

      
      await prisma.$transaction([
        prisma.charge.update({
          where: { id: charge.id },
          data: { 
            paidSoFar: newPaidSoFar,
            status: 'UNDERPAID'
           }
        }),
        prisma.webhookEvent.update({
          where: { id: eventId },
          data: {
            processed: true,
            processedAt: new Date(),
            reconciliationStatus: WebhookReconciliationStatus.UNDERPAYMENT
          }
        })
      ])

      
      if (member.phone) {
        try {
          await sendWhatsAppMessage(
            member.phone,
            `⚠️ *Partial Payment Received*\n\n` +
            `Hi ${member.name},\n\n` +
            `We received ₦${receivedAmount.toLocaleString()} for your *${charge.cycleId}* payment.\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `Expected:      ₦${expectedAmount.toLocaleString()}\n` +
            `Paid so far:   ₦${newPaidSoFar.toLocaleString()}\n` +
            `Still owed:    ₦${stillOwed.toLocaleString()}\n` +
            `━━━━━━━━━━━━━━━\n\n` +
            `Please pay the remaining ₦${stillOwed.toLocaleString()} into the same account number to complete this cycle.`
          )
          logger.info(
            `[WebhookService] Underpayment WhatsApp notification sent to ${member.name}`
          )
        } catch (notifyError) {
          logger.warn(
            `[WebhookService] WhatsApp notification failed: ${notifyError}`
          )
        }
      }

      try {
        getIO().to(member.orgId).emit('payment:underpayment', {
          memberName: member.name,
          identifier: member.identifier,
          expected: expectedAmount,
          received: receivedAmount,
          paidSoFar: newPaidSoFar,
          shortfall: stillOwed,
          senderName: customer?.senderName,
          txRef: transaction.transactionId,
          timestamp: new Date(),
        })
      } catch (socketError) {
        logger.warn(`[WebhookService] Socket emit failed: ${socketError}`)
      }

      return
    }

    
    if (newPaidSoFar > expectedAmount) {
      const excess = newPaidSoFar - expectedAmount

      logger.warn(
        `[WebhookService] OVERPAYMENT — member: ${member.name}, expected: ₦${expectedAmount}, received: ₦${newPaidSoFar}, excess: ₦${excess}`
      )

      // mark charge as paid regardless — member has paid more than enough
      await this.markChargeAsPaid(
        eventId,
        charge.id,
        transaction.transactionId,
        newPaidSoFar,
        member,
        WebhookReconciliationStatus.OVERPAYMENT
      )

      
      const senderAccountNumber = customer?.accountNumber
      const senderBankCode = customer?.bankCode

      if (senderAccountNumber && senderBankCode) {
        try {
          const refund = await paymentProvider.refundOverpayment(
            excess,
            senderAccountNumber,
            senderBankCode,
            customer?.senderName || 'Account Holder',
            transaction.transactionId
          )

          logger.info(
            `[WebhookService] Overpayment auto-refund initiated — ₦${excess} to ${senderAccountNumber}, ref: ${refund.transferRef}`
          )

          try {
            getIO().to(member.orgId).emit('payment:overpayment', {
              memberName: member.name,
              identifier: member.identifier,
              expected: expectedAmount,
              received: newPaidSoFar,
              excess,
              refundInitiated: true,
              refundRef: refund.transferRef,
              timestamp: new Date(),
              message: `${member.name} overpaid by ₦${excess.toLocaleString()}. Auto-refund of ₦${excess.toLocaleString()} has been initiated.`
            })
          } catch (socketError) {
            logger.warn(`[WebhookService] Socket emit failed: ${socketError}`)
          }

        } catch (refundError) {
          logger.error(
            `[WebhookService] Auto-refund failed for ${member.name}: ${refundError}`
          )

          try {
            getIO().to(member.orgId).emit('payment:overpayment', {
              memberName: member.name,
              identifier: member.identifier,
              expected: expectedAmount,
              received: newPaidSoFar,
              excess,
              refundInitiated: false,
              timestamp: new Date(),
              message: `${member.name} overpaid by ₦${excess.toLocaleString()}. Auto-refund failed — please refund manually.`
            })
          } catch (socketError) {
            logger.warn(`[WebhookService] Socket emit failed: ${socketError}`)
          }
        }
      } else {
        logger.warn(
          `[WebhookService] Cannot auto-refund — missing sender bank details for ${member.name}`
        )

        try {
          getIO().to(member.orgId).emit('payment:overpayment', {
            memberName: member.name,
            identifier: member.identifier,
            expected: expectedAmount,
            received: newPaidSoFar,
            excess,
            refundInitiated: false,
            timestamp: new Date(),
            message: `${member.name} overpaid by ₦${excess.toLocaleString()}. Sender bank details unavailable — please refund manually.`
          })
        } catch (socketError) {
          logger.warn(`[WebhookService] Socket emit failed: ${socketError}`)
        }
      }

      return
    }

    
    await this.markChargeAsPaid(
      eventId,
      charge.id,
      transaction.transactionId,
      newPaidSoFar,
      member,
      WebhookReconciliationStatus.SUCCESS
    )
  }


  private async handlePayoutSuccess(
    eventId: string,
    payload: NombaWebhookPayload
  ): Promise<void> {
    const { transaction } = payload.data

    if (!transaction.merchantTxRef) {
      logger.warn('[WebhookService] payout_success missing merchantTxRef')
      await this.webhookRepo.markProcessed(eventId)
      return
    }

    const payout = await prisma.payout.findFirst({
      where: { transferRef: transaction.merchantTxRef }
    })

    if (!payout) {
      logger.warn(
        `[WebhookService] No payout found for merchantTxRef: ${transaction.merchantTxRef}`
      )
      await this.webhookRepo.markProcessed(eventId)
      return
    }

    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      }),
      prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processed: true,
          processedAt: new Date(),
          reconciliationStatus: WebhookReconciliationStatus.PAYOUT_SUCCESS
        }
      })
    ])

    logger.info(
      `[WebhookService] Payout confirmed — ref: ${transaction.merchantTxRef}, amount: ₦${transaction.transactionAmount}`
    )

    try {
      getIO().to(payout.orgId).emit('payout:confirmed', {
        amount: payout.amount,
        transferRef: transaction.merchantTxRef,
        timestamp: new Date(),
      })
    } catch (socketError) {
      logger.warn(`[WebhookService] Socket emit failed: ${socketError}`)
    }
  }


  private async handlePayoutRefund(
    eventId: string,
    payload: NombaWebhookPayload
  ): Promise<void> {
    const { transaction } = payload.data

    if (!transaction.merchantTxRef) {
      logger.warn('[WebhookService] payout_refund missing merchantTxRef')
      await this.webhookRepo.markProcessed(eventId)
      return
    }

    const payout = await prisma.payout.findFirst({
      where: { transferRef: transaction.merchantTxRef }
    })

    if (!payout) {
      logger.warn(
        `[WebhookService] No payout found for refund — merchantTxRef: ${transaction.merchantTxRef}`
      )
      await this.webhookRepo.markProcessed(eventId)
      return
    }

    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'FAILED' }
      }),
      prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processed: true,
          processedAt: new Date(),
          reconciliationStatus: WebhookReconciliationStatus.PAYOUT_REFUNDED
        }
      })
    ])

    logger.warn(
      `[WebhookService] Payout refunded — ref: ${transaction.merchantTxRef}, amount: ₦${transaction.transactionAmount}`
    )

    try {
      getIO().to(payout.orgId).emit('payout:refunded', {
        amount: payout.amount,
        transferRef: transaction.merchantTxRef,
        timestamp: new Date(),
        message: 'Your payout was refunded by the bank. Please try again.'
      })
    } catch (socketError) {
      logger.warn(`[WebhookService] Socket emit failed: ${socketError}`)
    }
  }


  private async markChargeAsPaid(
    eventId: string,
    chargeId: string,
    transactionId: string,
    amount: number,
    member: { id: string; name: string; identifier: string; orgId: string },
    reconciliationStatus: WebhookReconciliationStatus
  ): Promise<void> {
    await prisma.$transaction([
      prisma.charge.update({
        where: { id: chargeId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          txRef: transactionId,
          amount,
          paidSoFar: amount
        },
      }),
      prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processed: true,
          processedAt: new Date(),
          reconciliationStatus
        },
      }),
    ])

    logger.info(
      `[WebhookService] Charge PAID — member: ${member.name} (${member.identifier}), amount: ₦${amount}, txRef: ${transactionId}, status: ${reconciliationStatus}`
    )

    try {
      getIO().to(member.orgId).emit('payment:received', {
        memberName: member.name,
        identifier: member.identifier,
        amount,
        paidAt: new Date(),
        txRef: transactionId,
        reconciliationStatus,
      })
    } catch (socketError) {
      logger.warn(`[WebhookService] Socket emit failed: ${socketError}`)
    }
  }

}