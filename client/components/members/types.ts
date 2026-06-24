export type MemberStatus = "Paid" | "Pending" | "Overdue";

export interface FeeLine {
  id: string;
  label: string;
  amount: string;
}

export interface PaymentRecord {
  id: string;
  cycle: string;
  amount: string;
  date: string;
  reference: string;
}

export interface Member {
  id: string;
  name: string;
  identifier: string;
  plan: string;
  accountNumber: string;
  bank: string;
  status: MemberStatus;
  lastPaymentDate: string;
  feeLines?: FeeLine[];
  paymentHistory: PaymentRecord[];
}

export type StatusFilter = "All" | MemberStatus;
