import type { PayoutDestination, PayoutRecord, PayoutStatus } from "./types";

export const AVAILABLE_BALANCE = "₦940,000.00";

export const DESTINATION_ACCOUNT: PayoutDestination = {
  bankName: "GTBank",
  accountLast4: "4821",
};

export const STATUS_STYLES: Record<PayoutStatus, string> = {
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Failed: "bg-rose-50 text-rose-700 border-rose-100",
};

export const MOCK_PAYOUTS: PayoutRecord[] = [
  {
    id: "PO-1042",
    date: "20 Jun 2026",
    amount: "₦500,000.00",
    bank: "GTBank",
    accountLast4: "4821",
    reference: "PYT-9921FA",
    status: "Completed",
  },
  {
    id: "PO-1041",
    date: "12 Jun 2026",
    amount: "₦250,000.00",
    bank: "GTBank",
    accountLast4: "4821",
    reference: "PYT-8810BC",
    status: "Completed",
  },
  {
    id: "PO-1040",
    date: "03 Jun 2026",
    amount: "₦120,000.00",
    bank: "GTBank",
    accountLast4: "4821",
    reference: "PYT-7704DE",
    status: "Failed",
  },
  {
    id: "PO-1039",
    date: "22 May 2026",
    amount: "₦400,000.00",
    bank: "GTBank",
    accountLast4: "4821",
    reference: "PYT-6612FG",
    status: "Completed",
  },
];
