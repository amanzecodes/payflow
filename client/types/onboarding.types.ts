export type OrgType = 'ESTATE' | 'COOPERATIVE' | 'GYM' | 'SCHOOL' | 'CLINIC' | 'OTHER'
export type Structure = 'FLAT' | 'VARIABLE'
export type CycleFrequency = 'MONTHLY' | 'YEARLY' | 'ONE_TIME' | 'CUSTOM'

export interface Bank {
  name: string
  code: string
}

export interface Organisation {
  id: string
  name: string
  type: OrgType
  structure: Structure
  slug: string
  adminWhatsapp: string
  payoutBankAccount: string
  payoutBankCode: string
  payoutAccountName: string
  payoutBankName: string
  inviteCode?: string
}

export interface Collection {
  id: string
  name: string
  cycle: CycleFrequency
  amount?: number
  structure: Structure
}

export interface FeeLine {
  id: string
  name: string
  amount: number
  collectionId: string
}

export interface Member {
  id: string
  name: string
  identifier: string
  phone?: string
  vaNumber: string
  vaBankName: string
  expectedAmount: number
}

export interface OnboardingState {
  step: 1 | 2 | 3 | 4
  orgId?: string
  orgName?: string
  orgType?: OrgType
  structure?: Structure
  adminWhatsapp?: string
  payoutBank?: Bank
  payoutAccountNumber?: string
  payoutAccountName?: string
  collectionId?: string
  collectionName?: string
  collectionCycle?: CycleFrequency
  collectionAmount?: number
  feeLines?: FeeLine[]
  members?: Member[]
  inviteCode?: string
}
