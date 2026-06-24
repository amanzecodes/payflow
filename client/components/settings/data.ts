import {
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineCreditCard,
  HiOutlineReceiptPercent,
} from "react-icons/hi2";

import type {
  CollectionSettings,
  FeeLine,
  OrganisationSettings,
  PayoutAccountSettings,
  SettingsTab,
} from "./types";

export const FREQUENCY_OPTIONS = ["Weekly", "Monthly", "Quarterly"];

export const TAB_DEFS: { id: SettingsTab; label: string; icon: typeof HiOutlineBanknotes }[] = [
  { id: "organisation", label: "Organisation", icon: HiOutlineBuildingOffice2 },
  { id: "collection", label: "Collection", icon: HiOutlineBanknotes },
  { id: "fee-lines", label: "Fee Lines", icon: HiOutlineReceiptPercent },
  { id: "payout-account", label: "Payout Account", icon: HiOutlineCreditCard },
];

export const NEXT_CYCLE_NOTE =
  "Changes here take effect from the next billing cycle. Members already in the current cycle keep their original expected amount.";

export const INITIAL_ORGANISATION: OrganisationSettings = {
  name: "Sunrise Cooperative",
  type: "Flow B",
};

export const INITIAL_COLLECTION: CollectionSettings = {
  name: "Monthly Dues",
  amountPerCycle: "10,000.00",
  frequency: "Monthly",
};

export const INITIAL_FEE_LINES: FeeLine[] = [
  { id: "FL-1", label: "Cooperative Dues", amount: "7,500.00", active: true },
  { id: "FL-2", label: "Welfare Levy", amount: "2,500.00", active: true },
  { id: "FL-3", label: "Building Fund", amount: "5,000.00", active: false },
];

export const INITIAL_PAYOUT_ACCOUNT: PayoutAccountSettings = {
  bankName: "GTBank",
  accountLast4: "4821",
};
