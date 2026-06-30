// types/dashboard.ts

export type ChargeStatus = 'PENDING' | 'PAID' | 'OVERDUE'

export interface Member {
  id: string
  orgId: string
  name: string
  identifier: string
  phone: string | null
  vaNumber: string
  vaBankName: string
  accountRef: string
  expectedAmount: number
  status: 'ACTIVE' | 'INACTIVE'
  accountSent: boolean
  createdAt: string
  updatedAt: string
}

export interface Charge {
  id: string
  memberId: string
  cycleId: string
  amount: number
  status: ChargeStatus
  paidAt: string | null
  txRef: string | null
  createdAt: string
  updatedAt: string
  member: Member
}

export interface Organisation {
  id: string
  name: string
  type: 'ESTATE' | 'COOPERATIVE' | 'GYM' | 'SCHOOL' | 'CLINIC' | 'OTHER'
  slug: string
  adminId: string | null
  adminWhatsapp: string
  adminEmail: string | null
  payoutBankAccount: string
  payoutBankCode: string
  payoutAccountName: string
  payoutBankName: string
  structure: 'FLAT' | 'VARIABLE'
  inviteCode: string | null
  createdAt: string
  updatedAt: string
}

export interface OrgBalance {
  totalCollected: number
  totalPayouts: number
  available: number
}

export interface CurrentCycle {
  period: string | undefined
  dueDate: string | undefined
  totalCollected: number
  outstanding: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  charges: Charge[]
}

export interface DashboardOverview {
  org: Organisation
  balance: OrgBalance
  currentCycle: CurrentCycle
  recentActivity: Charge[]
  totalMembers: number
  unsentAccounts: number
}

// the full API response wrapper
export interface DashboardOverviewResponse {
  success: boolean
  data: DashboardOverview
  error?: string
}