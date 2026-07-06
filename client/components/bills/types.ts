export type BillTab = "AIRTIME" | "DATA" | "ELECTRICITY";

export interface DataPlan {
  value: string;
  label: string;
  amount: number;
}
