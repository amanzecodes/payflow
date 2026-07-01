export type PayoutStatus = "PENDING" | "COMPLETED" | "FAILED"

export interface Payout {
  id: string
  createdAt: Date
  orgId: string
  amount: number
  status: PayoutStatus
  transferRef: string | null
  bankAccount: string
  bankCode: string
  bankName: string
  completedAt: Date | null
}

export interface PayoutPageData {
  balance: {
    totalCollected: number
    totalPayouts: number
    available: number
  }
  payouts: Payout[]
  payoutDestination: {
    bankName: string
    bankAccount: string
    last4: string
  }
}
