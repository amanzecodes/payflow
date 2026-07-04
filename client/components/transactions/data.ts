import type { StatusFilter, Transaction, TransactionStatus, TransactionType, TypeFilter } from "./types";

export const STATUS_FILTERS: StatusFilter[] = ["All", "Success", "Pending", "Failed"];
export const TYPE_FILTERS: TypeFilter[] = ["All", "Payments", "Payouts", "Refunds"];

export const STATUS_STYLES: Record<TransactionStatus, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
};

export const STATUS_DOT: Record<TransactionStatus, string> = {
  SUCCESS: "bg-emerald-400",
  PENDING: "bg-amber-400",
  FAILED: "bg-rose-400",
};

export const STATUS_LABEL: Record<TransactionStatus, string> = {
  SUCCESS: "Success",
  PENDING: "Pending",
  FAILED: "Failed",
};

export const TYPE_LABEL: Record<TransactionType, string> = {
  PAYMENT: "Payment",
  PAYOUT: "Payout",
  REFUND: "Refund",
};

export const formatNaira = (amount: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const DUMMY_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_01",
    reference: "REF-8K2QZX91A",
    type: "PAYMENT",
    status: "SUCCESS",
    amount: 45000,
    method: "Virtual Account",
    narration: "Q3 dues — Chidinma Okafor",
    createdAt: "2026-07-04T09:12:00Z",
    counterparty: { name: "Chidinma Okafor", identifier: "MEM-2201" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-07-04T09:11:40Z", done: true },
      { label: "Funds received", timestamp: "2026-07-04T09:12:00Z", done: true },
      { label: "Wallet credited", timestamp: "2026-07-04T09:12:05Z", done: true },
    ],
  },
  {
    id: "txn_02",
    reference: "REF-3P9LMN22B",
    type: "PAYOUT",
    status: "PENDING",
    amount: 320000,
    method: "Bank Transfer",
    narration: "Payout to GTBank •••• 4821",
    createdAt: "2026-07-04T07:40:00Z",
    counterparty: null,
    timeline: [
      { label: "Payout requested", timestamp: "2026-07-04T07:40:00Z", done: true },
      { label: "Processing at bank", timestamp: "2026-07-04T07:41:12Z", done: true },
      { label: "Funds settled", timestamp: "", done: false },
    ],
  },
  {
    id: "txn_03",
    reference: "REF-6D4RST88C",
    type: "PAYMENT",
    status: "SUCCESS",
    amount: 28500,
    method: "Card",
    narration: "Q3 dues — Tunde Bakare",
    createdAt: "2026-07-03T16:05:00Z",
    counterparty: { name: "Tunde Bakare", identifier: "MEM-2144" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-07-03T16:04:30Z", done: true },
      { label: "Funds received", timestamp: "2026-07-03T16:05:00Z", done: true },
      { label: "Wallet credited", timestamp: "2026-07-03T16:05:04Z", done: true },
    ],
  },
  {
    id: "txn_04",
    reference: "REF-1A7VWX55D",
    type: "PAYMENT",
    status: "FAILED",
    amount: 15000,
    method: "USSD",
    narration: "Q3 dues — Aisha Bello",
    createdAt: "2026-07-03T11:22:00Z",
    counterparty: { name: "Aisha Bello", identifier: "MEM-2078" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-07-03T11:21:50Z", done: true },
      { label: "Bank declined transfer", timestamp: "2026-07-03T11:22:00Z", done: true },
    ],
  },
  {
    id: "txn_05",
    reference: "REF-9F2GHJ33E",
    type: "REFUND",
    status: "SUCCESS",
    amount: 12000,
    method: "Virtual Account",
    narration: "Duplicate charge reversal — Emeka Eze",
    createdAt: "2026-07-02T14:50:00Z",
    counterparty: { name: "Emeka Eze", identifier: "MEM-1990" },
    timeline: [
      { label: "Refund initiated", timestamp: "2026-07-02T14:49:20Z", done: true },
      { label: "Funds returned", timestamp: "2026-07-02T14:50:00Z", done: true },
    ],
  },
  {
    id: "txn_06",
    reference: "REF-2Q8KLP77F",
    type: "PAYMENT",
    status: "SUCCESS",
    amount: 60000,
    method: "Bank Transfer",
    narration: "Q3 dues — Ngozi Adeyemi",
    createdAt: "2026-07-02T10:03:00Z",
    counterparty: { name: "Ngozi Adeyemi", identifier: "MEM-2033" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-07-02T10:02:40Z", done: true },
      { label: "Funds received", timestamp: "2026-07-02T10:03:00Z", done: true },
      { label: "Wallet credited", timestamp: "2026-07-02T10:03:05Z", done: true },
    ],
  },
  {
    id: "txn_07",
    reference: "REF-5H1NPQ66G",
    type: "PAYOUT",
    status: "SUCCESS",
    amount: 180000,
    method: "Bank Transfer",
    narration: "Payout to Zenith Bank •••• 7734",
    createdAt: "2026-07-01T18:15:00Z",
    counterparty: null,
    timeline: [
      { label: "Payout requested", timestamp: "2026-07-01T18:15:00Z", done: true },
      { label: "Processing at bank", timestamp: "2026-07-01T18:16:00Z", done: true },
      { label: "Funds settled", timestamp: "2026-07-01T18:22:00Z", done: true },
    ],
  },
  {
    id: "txn_08",
    reference: "REF-4T3RSX44H",
    type: "PAYMENT",
    status: "PENDING",
    amount: 33000,
    method: "Virtual Account",
    narration: "Q3 dues — Yusuf Suleiman",
    createdAt: "2026-07-01T13:47:00Z",
    counterparty: { name: "Yusuf Suleiman", identifier: "MEM-2115" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-07-01T13:46:50Z", done: true },
      { label: "Awaiting bank confirmation", timestamp: "2026-07-01T13:47:00Z", done: true },
      { label: "Wallet credited", timestamp: "", done: false },
    ],
  },
  {
    id: "txn_09",
    reference: "REF-7Y5VBN11I",
    type: "PAYMENT",
    status: "SUCCESS",
    amount: 45000,
    method: "Card",
    narration: "Q3 dues — Blessing Okoro",
    createdAt: "2026-06-30T09:30:00Z",
    counterparty: { name: "Blessing Okoro", identifier: "MEM-1987" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-06-30T09:29:40Z", done: true },
      { label: "Funds received", timestamp: "2026-06-30T09:30:00Z", done: true },
      { label: "Wallet credited", timestamp: "2026-06-30T09:30:06Z", done: true },
    ],
  },
  {
    id: "txn_10",
    reference: "REF-3M9CVX00J",
    type: "PAYMENT",
    status: "FAILED",
    amount: 45000,
    method: "USSD",
    narration: "Q3 dues — Kelechi Umeh",
    createdAt: "2026-06-29T20:12:00Z",
    counterparty: { name: "Kelechi Umeh", identifier: "MEM-2059" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-06-29T20:11:40Z", done: true },
      { label: "Insufficient funds", timestamp: "2026-06-29T20:12:00Z", done: true },
    ],
  },
  {
    id: "txn_11",
    reference: "REF-8L2ZQK99K",
    type: "PAYMENT",
    status: "SUCCESS",
    amount: 22000,
    method: "Virtual Account",
    narration: "Q3 dues — Fatima Abubakar",
    createdAt: "2026-06-29T08:05:00Z",
    counterparty: { name: "Fatima Abubakar", identifier: "MEM-2210" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-06-29T08:04:40Z", done: true },
      { label: "Funds received", timestamp: "2026-06-29T08:05:00Z", done: true },
      { label: "Wallet credited", timestamp: "2026-06-29T08:05:05Z", done: true },
    ],
  },
  {
    id: "txn_12",
    reference: "REF-6R4WYT88L",
    type: "PAYOUT",
    status: "FAILED",
    amount: 90000,
    method: "Bank Transfer",
    narration: "Payout to Access Bank •••• 1102",
    createdAt: "2026-06-28T17:00:00Z",
    counterparty: null,
    timeline: [
      { label: "Payout requested", timestamp: "2026-06-28T17:00:00Z", done: true },
      { label: "Account name mismatch", timestamp: "2026-06-28T17:02:00Z", done: true },
    ],
  },
  {
    id: "txn_13",
    reference: "REF-9J6XPL77M",
    type: "PAYMENT",
    status: "SUCCESS",
    amount: 38000,
    method: "Bank Transfer",
    narration: "Q3 dues — Ifeoma Nwosu",
    createdAt: "2026-06-27T12:33:00Z",
    counterparty: { name: "Ifeoma Nwosu", identifier: "MEM-2002" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-06-27T12:32:40Z", done: true },
      { label: "Funds received", timestamp: "2026-06-27T12:33:00Z", done: true },
      { label: "Wallet credited", timestamp: "2026-06-27T12:33:05Z", done: true },
    ],
  },
  {
    id: "txn_14",
    reference: "REF-2C1DFG66N",
    type: "PAYMENT",
    status: "SUCCESS",
    amount: 50000,
    method: "Card",
    narration: "Q3 dues — Emeka Eze",
    createdAt: "2026-06-26T15:48:00Z",
    counterparty: { name: "Emeka Eze", identifier: "MEM-1990" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-06-26T15:47:40Z", done: true },
      { label: "Funds received", timestamp: "2026-06-26T15:48:00Z", done: true },
      { label: "Wallet credited", timestamp: "2026-06-26T15:48:05Z", done: true },
    ],
  },
  {
    id: "txn_15",
    reference: "REF-5V8HJK55O",
    type: "PAYOUT",
    status: "SUCCESS",
    amount: 250000,
    method: "Bank Transfer",
    narration: "Payout to GTBank •••• 4821",
    createdAt: "2026-06-25T09:20:00Z",
    counterparty: null,
    timeline: [
      { label: "Payout requested", timestamp: "2026-06-25T09:20:00Z", done: true },
      { label: "Processing at bank", timestamp: "2026-06-25T09:21:00Z", done: true },
      { label: "Funds settled", timestamp: "2026-06-25T09:29:00Z", done: true },
    ],
  },
  {
    id: "txn_16",
    reference: "REF-1B3KLM44P",
    type: "PAYMENT",
    status: "PENDING",
    amount: 27000,
    method: "Virtual Account",
    narration: "Q3 dues — Tunde Bakare",
    createdAt: "2026-06-24T19:00:00Z",
    counterparty: { name: "Tunde Bakare", identifier: "MEM-2144" },
    timeline: [
      { label: "Payment initiated", timestamp: "2026-06-24T18:59:40Z", done: true },
      { label: "Awaiting bank confirmation", timestamp: "2026-06-24T19:00:00Z", done: true },
      { label: "Wallet credited", timestamp: "", done: false },
    ],
  },
];
