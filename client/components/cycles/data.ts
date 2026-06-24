import type { Cycle, CycleMemberStatus } from "./types";

export const STATUS_STYLES: Record<CycleMemberStatus, string> = {
  Overdue: "bg-rose-50 text-rose-700 border-rose-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const STATUS_WEIGHT: Record<CycleMemberStatus, number> = {
  Overdue: 0,
  Pending: 1,
  Paid: 2,
};

const JUNE_MEMBERS = [
  { id: "C6-1", name: "Tunde Bakare", identifier: "MEM-0192", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "02 Jun 2026", reference: "REF-7732A1" },
  { id: "C6-2", name: "Chidinma Okeke", identifier: "MEM-0177", status: "Paid" as CycleMemberStatus, amount: "₦15,000.00", paymentDate: "03 Jun 2026", reference: "REF-9012X3" },
  { id: "C6-3", name: "Yusuf Aliyu", identifier: "MEM-0145", status: "Overdue" as CycleMemberStatus, amount: "₦20,000.00" },
  { id: "C6-4", name: "Amaka Eze", identifier: "MEM-0210", status: "Pending" as CycleMemberStatus, amount: "₦10,000.00" },
  { id: "C6-5", name: "Femi Adewale", identifier: "MEM-0098", status: "Paid" as CycleMemberStatus, amount: "₦25,000.00", paymentDate: "05 Jun 2026", reference: "REF-1182M4" },
  { id: "C6-6", name: "Grace Obi", identifier: "MEM-0233", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "01 Jun 2026", reference: "REF-0129X92" },
  { id: "C6-7", name: "Ibrahim Musa", identifier: "MEM-0061", status: "Overdue" as CycleMemberStatus, amount: "₦30,000.00" },
  { id: "C6-8", name: "Ngozi Umeh", identifier: "MEM-0184", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "04 Jun 2026", reference: "REF-4491B09" },
];

const MAY_MEMBERS = [
  { id: "C5-1", name: "Tunde Bakare", identifier: "MEM-0192", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "03 May 2026", reference: "REF-5521B9" },
  { id: "C5-2", name: "Chidinma Okeke", identifier: "MEM-0177", status: "Paid" as CycleMemberStatus, amount: "₦15,000.00", paymentDate: "02 May 2026", reference: "REF-3398L2" },
  { id: "C5-3", name: "Yusuf Aliyu", identifier: "MEM-0145", status: "Paid" as CycleMemberStatus, amount: "₦20,000.00", paymentDate: "06 May 2026", reference: "REF-7741P5" },
  { id: "C5-4", name: "Amaka Eze", identifier: "MEM-0210", status: "Overdue" as CycleMemberStatus, amount: "₦10,000.00" },
  { id: "C5-5", name: "Femi Adewale", identifier: "MEM-0098", status: "Paid" as CycleMemberStatus, amount: "₦25,000.00", paymentDate: "04 May 2026", reference: "REF-8845D1" },
  { id: "C5-6", name: "Grace Obi", identifier: "MEM-0233", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "01 May 2026", reference: "REF-6620C7" },
  { id: "C5-7", name: "Ibrahim Musa", identifier: "MEM-0061", status: "Paid" as CycleMemberStatus, amount: "₦30,000.00", paymentDate: "05 May 2026", reference: "REF-8812A11" },
  { id: "C5-8", name: "Ngozi Umeh", identifier: "MEM-0184", status: "Pending" as CycleMemberStatus, amount: "₦10,000.00" },
];

const APRIL_MEMBERS = [
  { id: "C4-1", name: "Tunde Bakare", identifier: "MEM-0192", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "12 Apr 2026", reference: "REF-2210F4" },
  { id: "C4-2", name: "Chidinma Okeke", identifier: "MEM-0177", status: "Overdue" as CycleMemberStatus, amount: "₦15,000.00" },
  { id: "C4-3", name: "Yusuf Aliyu", identifier: "MEM-0145", status: "Paid" as CycleMemberStatus, amount: "₦20,000.00", paymentDate: "28 Apr 2026", reference: "REF-3398L1" },
  { id: "C4-4", name: "Amaka Eze", identifier: "MEM-0210", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "19 Apr 2026", reference: "REF-6620C6" },
  { id: "C4-5", name: "Femi Adewale", identifier: "MEM-0098", status: "Paid" as CycleMemberStatus, amount: "₦25,000.00", paymentDate: "20 Apr 2026", reference: "REF-1182M3" },
  { id: "C4-6", name: "Grace Obi", identifier: "MEM-0233", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "23 Apr 2026", reference: "REF-0129X91" },
  { id: "C4-7", name: "Ibrahim Musa", identifier: "MEM-0061", status: "Paid" as CycleMemberStatus, amount: "₦30,000.00", paymentDate: "23 Apr 2026", reference: "REF-8812A10" },
  { id: "C4-8", name: "Ngozi Umeh", identifier: "MEM-0184", status: "Paid" as CycleMemberStatus, amount: "₦10,000.00", paymentDate: "22 Apr 2026", reference: "REF-4491B08" },
];

const countByStatus = (members: { status: CycleMemberStatus }[], status: CycleMemberStatus) =>
  members.filter((member) => member.status === status).length;

const sumPaid = (members: { status: CycleMemberStatus; amount: string }[]) =>
  members
    .filter((member) => member.status === "Paid")
    .reduce((total, member) => total + Number(member.amount.replace(/[₦,]/g, "")), 0);

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const buildCycle = (id: string, period: string, members: typeof JUNE_MEMBERS): Cycle => ({
  id,
  period,
  totalMembers: members.length,
  paidCount: countByStatus(members, "Paid"),
  pendingCount: countByStatus(members, "Pending"),
  overdueCount: countByStatus(members, "Overdue"),
  totalCollected: formatNaira(sumPaid(members)),
  members,
});

export const MOCK_CYCLES: Cycle[] = [
  buildCycle("CYC-006", "June 2026", JUNE_MEMBERS),
  buildCycle("CYC-005", "May 2026", MAY_MEMBERS),
  buildCycle("CYC-004", "April 2026", APRIL_MEMBERS),
];
