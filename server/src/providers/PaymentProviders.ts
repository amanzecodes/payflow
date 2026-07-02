export interface VirtualAccountResult {
  accountNumber: string
  bankName: string
}

export interface TransferResult {
  transferRef: string
  status: string
}

export interface BalanceResult {
  balance: number
}

// ─── NOMBA WEBHOOK PAYLOAD ────────────────────────────────────────────────────
// source: Nomba developer docs — webhook payload reference

export type NombaEventType =
  | 'payment_success'
  | 'payment_failed'
  | 'payout_success'
  | 'payout_refund'

export interface NombaMerchant {
  walletId?: string
  walletBalance?: number
  userId: string
}

export interface NombaTransaction {
  // virtual account payment fields
  aliasAccountNumber?: string      // the VA number — used for reconciliation
  aliasAccountName?: string
  aliasAccountType?: string        // "VIRTUAL" for VA payments
  aliasAccountReference?: string

  // common fields
  transactionId: string            // unique transaction ID
  transactionAmount: number        // amount received
  fee?: number
  sessionId?: string
  type: string                     // "vact_transfer" | "transfer" | "purchase"
  narration?: string
  time: string                     // RFC-3339 timestamp
  responseCode?: string
  responseCodeMessage?: string
  originatingFrom?: string         // "api" | "pos"

  // payout specific fields
  merchantTxRef?: string

  // pos specific fields
  terminalSerialNumber?: string
  cardIssuer?: string
  rrn?: string
  cardBank?: string
}

export interface NombaCustomer {
  bankCode?: string
  senderName?: string
  bankName?: string
  accountNumber?: string
  recipientName?: string
  productId?: string
  cardPan?: string
}

export interface NombaTerminal {
  terminalLabel?: string
  terminalId?: string
}

export interface NombaWebhookPayload {
  event_type: NombaEventType
  requestId: string
  data: {
    merchant: NombaMerchant
    terminal: NombaTerminal
    transaction: NombaTransaction
    customer: NombaCustomer
  }
}

export interface PaymentProvider {
  createVirtualAccount(
    ref: string,
    name: string,
    expectedAmount: number
  ): Promise<VirtualAccountResult>

  transferToBank(
    amount: number,
    bankAccount: string,
    bankCode: string
  ): Promise<TransferResult>

  getBankList(): Promise<Array<{ code: string; name: string }>>

  lookupBankAccountPublic(
    accountNumber: string,
    bankCode: string
  ): Promise<string>

  verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: string
  ): boolean
}