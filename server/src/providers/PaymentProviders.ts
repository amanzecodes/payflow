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

  getParentBalance(): Promise<BalanceResult>

  verifyWebhookSignature(payload: unknown, headers: Record<string, string>): boolean
}