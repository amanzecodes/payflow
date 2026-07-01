import type { StatusFilter } from "./types";

export const STATUS_FILTERS: StatusFilter[] = ["All", "Overdue", "Pending", "Paid"];

export const CHARGE_STATUS_STYLES: Record<
  "PENDING" | "PAID" | "OVERDUE",
  string
> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-rose-50 text-rose-700 border-rose-200",
};

export const CHARGE_STATUS_DOT: Record<
  "PENDING" | "PAID" | "OVERDUE",
  string
> = {
  PENDING: "bg-amber-400",
  PAID: "bg-emerald-400",
  OVERDUE: "bg-rose-400",
};

export const getChargeStatusDisplay = (
  status: "PENDING" | "PAID" | "OVERDUE" | null | undefined
): string => {
  if (!status) return "Unknown";
  const statusMap: Record<"PENDING" | "PAID" | "OVERDUE", string> = {
    PENDING: "Pending",
    PAID: "Paid",
    OVERDUE: "Overdue",
  };
  return statusMap[status];
};
