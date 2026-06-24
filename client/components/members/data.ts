import type { Member, MemberStatus, StatusFilter } from "./types";

export const STATUS_FILTERS: StatusFilter[] = ["All", "Overdue", "Pending", "Paid"];

export const STATUS_WEIGHT: Record<MemberStatus, number> = {
  Overdue: 0,
  Pending: 1,
  Paid: 2,
};

export const STATUS_STYLES: Record<MemberStatus, string> = {
  Overdue: "bg-rose-50 text-rose-700 border-rose-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const STATUS_DOT: Record<MemberStatus, string> = {
  Overdue: "bg-rose-500",
  Pending: "bg-amber-500",
  Paid: "bg-emerald-500",
};

export const MOCK_MEMBERS: Member[] = [
  {
    id: "M-001",
    name: "Tunde Bakare",
    identifier: "MEM-0192",
    plan: "₦10,000.00 / cycle",
    accountNumber: "9012 3344 56",
    bank: "Nomba MFB",
    status: "Overdue",
    lastPaymentDate: "14 May 2026",
    feeLines: [
      { id: "F-1", label: "Cooperative Dues", amount: "₦7,500.00" },
      { id: "F-2", label: "Welfare Levy", amount: "₦2,500.00" },
    ],
    paymentHistory: [
      { id: "P-1", cycle: "Cycle 04 · Apr 2026", amount: "₦10,000.00", date: "12 Apr 2026", reference: "REF-7732A1" },
      { id: "P-2", cycle: "Cycle 03 · Mar 2026", amount: "₦10,000.00", date: "11 Mar 2026", reference: "REF-5521B9" },
    ],
  },
  {
    id: "M-002",
    name: "Chidinma Okeke",
    identifier: "MEM-0177",
    plan: "₦15,000.00 / cycle",
    accountNumber: "8123 9087 21",
    bank: "Nomba MFB",
    status: "Overdue",
    lastPaymentDate: "02 May 2026",
    paymentHistory: [
      { id: "P-3", cycle: "Cycle 04 · Apr 2026", amount: "₦15,000.00", date: "02 Apr 2026", reference: "REF-9012X3" },
    ],
  },
  {
    id: "M-003",
    name: "Yusuf Aliyu",
    identifier: "MEM-0145",
    plan: "₦20,000.00 / cycle",
    accountNumber: "7765 4432 90",
    bank: "Nomba MFB",
    status: "Overdue",
    lastPaymentDate: "28 Apr 2026",
    feeLines: [
      { id: "F-3", label: "Cooperative Dues", amount: "₦15,000.00" },
      { id: "F-4", label: "Building Fund", amount: "₦5,000.00" },
    ],
    paymentHistory: [
      { id: "P-4", cycle: "Cycle 03 · Mar 2026", amount: "₦20,000.00", date: "28 Mar 2026", reference: "REF-3398L2" },
    ],
  },
  {
    id: "M-004",
    name: "Amaka Eze",
    identifier: "MEM-0210",
    plan: "₦10,000.00 / cycle",
    accountNumber: "5520 1183 67",
    bank: "Nomba MFB",
    status: "Pending",
    lastPaymentDate: "19 May 2026",
    paymentHistory: [
      { id: "P-5", cycle: "Cycle 04 · Apr 2026", amount: "₦10,000.00", date: "19 Apr 2026", reference: "REF-6620C7" },
    ],
  },
  {
    id: "M-005",
    name: "Femi Adewale",
    identifier: "MEM-0098",
    plan: "₦25,000.00 / cycle",
    accountNumber: "4471 8820 11",
    bank: "Nomba MFB",
    status: "Pending",
    lastPaymentDate: "20 May 2026",
    feeLines: [
      { id: "F-5", label: "Cooperative Dues", amount: "₦20,000.00" },
      { id: "F-6", label: "Welfare Levy", amount: "₦5,000.00" },
    ],
    paymentHistory: [
      { id: "P-6", cycle: "Cycle 04 · Apr 2026", amount: "₦25,000.00", date: "20 Apr 2026", reference: "REF-1182M4" },
      { id: "P-7", cycle: "Cycle 03 · Mar 2026", amount: "₦25,000.00", date: "19 Mar 2026", reference: "REF-7741P5" },
    ],
  },
  {
    id: "M-006",
    name: "Grace Obi",
    identifier: "MEM-0233",
    plan: "₦10,000.00 / cycle",
    accountNumber: "3390 7765 44",
    bank: "Nomba MFB",
    status: "Paid",
    lastPaymentDate: "23 May 2026",
    paymentHistory: [
      { id: "P-8", cycle: "Cycle 04 · Apr 2026", amount: "₦10,000.00", date: "23 Apr 2026", reference: "REF-0129X92" },
      { id: "P-9", cycle: "Cycle 03 · Mar 2026", amount: "₦10,000.00", date: "21 Mar 2026", reference: "REF-8845D1" },
    ],
  },
  {
    id: "M-007",
    name: "Ibrahim Musa",
    identifier: "MEM-0061",
    plan: "₦30,000.00 / cycle",
    accountNumber: "2287 5541 09",
    bank: "Nomba MFB",
    status: "Paid",
    lastPaymentDate: "23 May 2026",
    feeLines: [
      { id: "F-7", label: "Cooperative Dues", amount: "₦22,000.00" },
      { id: "F-8", label: "Building Fund", amount: "₦8,000.00" },
    ],
    paymentHistory: [
      { id: "P-10", cycle: "Cycle 04 · Apr 2026", amount: "₦30,000.00", date: "23 Apr 2026", reference: "REF-8812A11" },
    ],
  },
  {
    id: "M-008",
    name: "Ngozi Umeh",
    identifier: "MEM-0184",
    plan: "₦10,000.00 / cycle",
    accountNumber: "1145 9982 30",
    bank: "Nomba MFB",
    status: "Paid",
    lastPaymentDate: "22 May 2026",
    paymentHistory: [
      { id: "P-11", cycle: "Cycle 04 · Apr 2026", amount: "₦10,000.00", date: "22 Apr 2026", reference: "REF-4491B09" },
    ],
  },
];
