import type { BillPurchase, BillStatus, BillTab, DataPlan } from "./types";

export const WALLET_BALANCE = 216956;

export const NETWORKS = [
  { label: "MTN", value: "MTN" },
  { label: "Airtel", value: "AIRTEL" },
  { label: "Glo", value: "GLO" },
  { label: "9mobile", value: "NINEMOBILE" },
];

export const DATA_PLANS: Record<string, DataPlan[]> = {
  MTN: [
    { value: "mtn-1gb", label: "1GB - 30 days - ₦1,000", amount: 1000 },
    { value: "mtn-2gb", label: "2GB - 30 days - ₦1,500", amount: 1500 },
    { value: "mtn-5gb", label: "5GB - 30 days - ₦3,500", amount: 3500 },
    { value: "mtn-10gb", label: "10GB - 30 days - ₦5,000", amount: 5000 },
  ],
  AIRTEL: [
    { value: "airtel-1-5gb", label: "1.5GB - 30 days - ₦1,200", amount: 1200 },
    { value: "airtel-4-5gb", label: "4.5GB - 30 days - ₦3,000", amount: 3000 },
    { value: "airtel-10gb", label: "10GB - 30 days - ₦5,000", amount: 5000 },
  ],
  GLO: [
    { value: "glo-1-35gb", label: "1.35GB - 30 days - ₦1,000", amount: 1000 },
    { value: "glo-2-9gb", label: "2.9GB - 30 days - ₦2,000", amount: 2000 },
    { value: "glo-7-7gb", label: "7.7GB - 30 days - ₦4,000", amount: 4000 },
  ],
  NINEMOBILE: [
    { value: "9mobile-1-5gb", label: "1.5GB - 30 days - ₦1,200", amount: 1200 },
    { value: "9mobile-4-5gb", label: "4.5GB - 30 days - ₦3,000", amount: 3000 },
  ],
};

export const DISTRIBUTORS = [
  { label: "Eko Electricity (EKEDC)", value: "EKEDC" },
  { label: "Ikeja Electric (IKEDC)", value: "IKEDC" },
  { label: "Abuja Electricity (AEDC)", value: "AEDC" },
  { label: "Ibadan Electricity (IBEDC)", value: "IBEDC" },
  { label: "Port Harcourt Electricity (PHED)", value: "PHED" },
  { label: "Kano Electricity (KEDCO)", value: "KEDCO" },
];

export const METER_TYPES = [
  { label: "Prepaid", value: "PREPAID" },
  { label: "Postpaid", value: "POSTPAID" },
];

export const STATUS_STYLES: Record<BillStatus, string> = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
};

export const STATUS_LABEL: Record<BillStatus, string> = {
  SUCCESS: "Successful",
  PENDING: "Pending",
  FAILED: "Failed",
};

export const formatNaira = (amount: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);

export const formatRelativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.round(diffMs / hour)}h ago`;
  if (diffMs < week) return `${Math.round(diffMs / day)}d ago`;
  if (diffMs < month) return `${Math.round(diffMs / week)}w ago`;
  return `${Math.round(diffMs / month)}mo ago`;
};

const daysAgo = (days: number): string => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const purchase = (
  id: string,
  type: BillTab,
  provider: string,
  identifier: string,
  amount: number,
  status: BillStatus,
  days: number
): BillPurchase => ({ id, type, provider, identifier, amount, status, createdAt: daysAgo(days) });

export const DUMMY_PURCHASES: BillPurchase[] = [
  purchase("bill_01", "DATA", "GLO", "07052302000", 1500, "PENDING", 7),
  purchase("bill_02", "AIRTIME", "GLO", "08145982310", 2600, "SUCCESS", 30),
  purchase("bill_03", "AIRTIME", "NINEMOBILE", "07033445566", 3900, "SUCCESS", 31),
  purchase("bill_04", "DATA", "AIRTEL", "08012345678", 4500, "SUCCESS", 32),
  purchase("bill_05", "ELECTRICITY", "IBEDC", "6639161191", 15000, "SUCCESS", 33),
  purchase("bill_06", "DATA", "MTN", "07033445566", 3500, "SUCCESS", 60),
  purchase("bill_07", "ELECTRICITY", "IKEDC", "9766516181", 18000, "SUCCESS", 62),
];
