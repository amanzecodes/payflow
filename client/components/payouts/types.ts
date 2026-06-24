export type PayoutStatus = "Completed" | "Pending" | "Failed";

export interface PayoutDestination {
  bankName: string;
  accountLast4: string;
}

export interface PayoutRecord {
  id: string;
  date: string;
  amount: string;
  bank: string;
  accountLast4: string;
  reference: string;
  status: PayoutStatus;
}
