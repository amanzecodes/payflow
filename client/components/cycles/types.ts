export type CycleMemberStatus = "Paid" | "Pending" | "Overdue";

export interface CycleMemberRecord {
  id: string;
  name: string;
  identifier: string;
  status: CycleMemberStatus;
  amount: string;
  paymentDate?: string;
  reference?: string;
}

export interface Cycle {
  id: string;
  period: string;
  totalMembers: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalCollected: string;
  members: CycleMemberRecord[];
}
