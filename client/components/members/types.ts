export type MemberStatus = "ACTIVE" | "Paid" | "Pending" | "Overdue";

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
  phone: string | null;
  expectedAmount: number;
  orgId: string;
  vaNumber: string;
  vaBankName: string;
  accountRef: string;
  status: MemberStatus;
  accountSent: boolean;
  createdAt: Date;
  updatedAt: Date;
  feeLines?: FeeLine[];
  paymentHistory?: PaymentRecord[];
}

export type StatusFilter = "All" | "Overdue" | "Pending" | "Paid";
