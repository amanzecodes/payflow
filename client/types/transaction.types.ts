export type TransactionEventType =
  | "payment_success"
  | "payment_failed"
  | "payout_success"
  | "payout_refund";

export type TransactionRecordType = "Payment" | "Payout";

export type ReconciliationStatus =
  | "SUCCESS"
  | "UNDERPAYMENT"
  | "OVERPAYMENT"
  | "PAYMENT_FAILED"
  | "PAYOUT_SUCCESS"
  | "PAYOUT_REFUNDED"
  | null;

export interface TransactionMember {
  id: string;
  name: string;
  identifier: string;
}

export interface TransactionPayout {
  bankName: string;
  last4: string;
}

export interface TransactionRecord {
  id: string;
  eventType: TransactionEventType;
  type: TransactionRecordType;
  method: string;
  amount: number;
  reconciliationStatus: ReconciliationStatus;
  txRef: string;
  processed: boolean;
  processedAt: string | null;
  createdAt: string;
  member: TransactionMember | null;
  payout: TransactionPayout | null;
}

export interface TransactionStats {
  totalVolume: number;
  totalCount: number;
  moneyIn: number;
  moneyInCount: number;
  moneyOut: number;
  needsAttention: number;
  pendingCount: number;
  failedCount: number;
  successCount: number;
}

export interface TransactionPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TransactionsPageData {
  stats: TransactionStats;
  transactions: TransactionRecord[];
  pagination: TransactionPagination;
}
