export type OrgType = "Flow A" | "Flow B";

export type SettingsTab = "organisation" | "collection" | "fee-lines" | "payout-account";

export interface OrganisationSettings {
  name: string;
  type: OrgType;
}

export interface CollectionSettings {
  name: string;
  amountPerCycle: string;
  frequency: string;
}

export interface FeeLine {
  id: string;
  label: string;
  amount: string;
  active: boolean;
}

export interface PayoutAccountSettings {
  bankName: string;
  accountLast4: string;
}
