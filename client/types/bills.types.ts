export type AirtimeNetwork = "MTN" | "AIRTEL" | "GLO" | "9MOBILE";

export interface VendAirtimePayload {
  phoneNumber: string;
  network: AirtimeNetwork;
  amount: number;
}

export interface VendAirtimeData {
  amount: number;
  network: AirtimeNetwork;
  phoneNumber: string;
  reference: string;
  message: string;
}

export type BillType = "AIRTIME" | "DATA" | "ELECTRICITY" | "CABLETV";
export type BillStatus = "COMPLETED" | "PENDING" | "FAILED";

export interface BillHistoryItem {
  id: string;
  type: BillType;
  amount: number;
  status: BillStatus;
  reference: string | null;
  createdAt: string;
  phoneNumber: string | null;
  network: AirtimeNetwork | null;
  disco: string | null;
  meterNumber: string | null;
}
