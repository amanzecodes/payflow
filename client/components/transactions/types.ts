export type TransactionType = "PAYMENT" | "PAYOUT" | "REFUND";
export type TransactionStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface TimelineEvent {
  label: string;
  timestamp: string;
  done: boolean;
}

export interface Transaction {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  method: string;
  narration: string;
  createdAt: string;
  counterparty: {
    name: string;
    identifier: string;
  } | null;
  timeline: TimelineEvent[];
}

export type StatusFilter = "All" | "Success" | "Pending" | "Failed";
export type TypeFilter = "All" | "Payments" | "Payouts" | "Refunds";
