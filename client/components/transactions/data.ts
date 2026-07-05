import type { TransactionRecord } from "@/types/transaction.types";
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

const mapRecordType = (record: TransactionRecord): TransactionType =>
  record.type === "Payout" ? "PAYOUT" : "PAYMENT";

// The API's reconciliationStatus has more states than the UI's 3-way status.
// An unprocessed event is still settling ("PENDING"); UNDERPAYMENT/OVERPAYMENT
// still moved money so they read as "SUCCESS", while a refunded payout means
// the money bounced back, so it reads as "FAILED".
const mapRecordStatus = (record: TransactionRecord): TransactionStatus => {
  if (!record.processed || record.reconciliationStatus === null) return "PENDING";

  switch (record.reconciliationStatus) {
    case "SUCCESS":
    case "PAYOUT_SUCCESS":
    case "UNDERPAYMENT":
    case "OVERPAYMENT":
      return "SUCCESS";
    case "PAYMENT_FAILED":
    case "PAYOUT_REFUNDED":
      return "FAILED";
    default:
      return "PENDING";
  }
};

const mapRecordNarration = (record: TransactionRecord): string => {
  if (record.member) {
    return `${record.type === "Payout" ? "Payout" : "Payment"} — ${record.member.name}`;
  }
  if (record.payout) {
    return `Payout to ${record.payout.bankName} •••• ${record.payout.last4}`;
  }
  return record.type;
};

const mapRecordTimeline = (record: TransactionRecord) => {
  const status = mapRecordStatus(record);
  const initiatedLabel = record.type === "Payout" ? "Payout requested" : "Payment initiated";

  if (!record.processed || !record.processedAt) {
    return [
      { label: initiatedLabel, timestamp: record.createdAt, done: true },
      { label: "Awaiting confirmation", timestamp: "", done: false },
    ];
  }

  const completedLabel =
    status === "FAILED"
      ? record.type === "Payout"
        ? "Payout failed"
        : "Payment failed"
      : record.type === "Payout"
        ? "Funds settled"
        : "Wallet credited";

  return [
    { label: initiatedLabel, timestamp: record.createdAt, done: true },
    { label: completedLabel, timestamp: record.processedAt, done: true },
  ];
};

export const toTransaction = (record: TransactionRecord): Transaction => ({
  id: record.id,
  reference: record.txRef,
  type: mapRecordType(record),
  status: mapRecordStatus(record),
  amount: record.amount,
  method: record.method,
  narration: mapRecordNarration(record),
  createdAt: record.createdAt,
  counterparty: record.member
    ? { name: record.member.name, identifier: record.member.identifier }
    : null,
  timeline: mapRecordTimeline(record),
});

