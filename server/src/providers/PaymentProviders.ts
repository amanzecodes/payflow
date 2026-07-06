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
  aliasAccountNumber?: string      
  aliasAccountName?: string
  aliasAccountType?: string        
  aliasAccountReference?: string
  transactionId: string
  transactionAmount: number
  fee?: number
  sessionId?: string
  type: string         
  narration?: string
  time: string         
  responseCode?: string
  responseCodeMessage?: string
  originatingFrom?: string
  merchantTxRef?: string
  terminalSerialNumber?: string
  cardIssuer?: string
  rrn?: string
  cardBank?: string
}

type NombaNetwork = 'MTN' | 'GLO' | 'AIRTEL' | '9MOBILE'

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

  refundOverpayment(
    amount: number,
    accountNumber: string,
    bankCode: string,
    senderName: string,
    originalTxRef: string
  ): Promise<TransferResult>

  vendAirtime(
  phoneNumber: string,
  network: NombaNetwork,
  amount: number
): Promise<{ merchantTxRef: string; rrn: string; status: string }>

  verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: string
  ): boolean
}