export type BillTab = "AIRTIME" | "DATA" | "ELECTRICITY";
export type BillStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface DataPlan {
  value: string;
  label: string;
  amount: number;
}

export interface BillPurchase {
  id: string;
  type: BillTab;
  provider: string;
  identifier: string;
  amount: number;
  status: BillStatus;
  createdAt: string;
}
