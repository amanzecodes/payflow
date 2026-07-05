import { Payout } from "../generated/prisma/client"

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface OrgBalance {
  totalCollected: number
  totalPayouts: number
  available: number
}

export interface JwtPayload {
  adminId: string
  email: string
  phone: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const BANK_CODES: Record<string, { code: string; name: string }> = {
  'gtbank': { code: '058', name: 'GTBank' },
  'gtb': { code: '058', name: 'GTBank' },
  'access': { code: '044', name: 'Access Bank' },
  'access bank': { code: '044', name: 'Access Bank' },
  'zenith': { code: '057', name: 'Zenith Bank' },
  'zenith bank': { code: '057', name: 'Zenith Bank' },
  'uba': { code: '033', name: 'UBA' },
  'united bank': { code: '033', name: 'UBA' },
  'first bank': { code: '011', name: 'First Bank' },
  'firstbank': { code: '011', name: 'First Bank' },
  'fbn': { code: '011', name: 'First Bank' },
  'stanbic': { code: '221', name: 'Stanbic IBTC' },
  'stanbic ibtc': { code: '221', name: 'Stanbic IBTC' },
  'fcmb': { code: '214', name: 'FCMB' },
  'fidelity': { code: '070', name: 'Fidelity Bank' },
  'sterling': { code: '232', name: 'Sterling Bank' },
  'union': { code: '032', name: 'Union Bank' },
  'union bank': { code: '032', name: 'Union Bank' },
  'wema': { code: '035', name: 'Wema Bank' },
  'alat': { code: '035', name: 'Wema Bank' },
  'ecobank': { code: '050', name: 'Ecobank' },
  'keystone': { code: '082', name: 'Keystone Bank' },
  'polaris': { code: '076', name: 'Polaris Bank' },
  'opay': { code: '999992', name: 'OPay' },
  'palmpay': { code: '999991', name: 'PalmPay' },
  'kuda': { code: '090267', name: 'Kuda Bank' },
  'moniepoint': { code: '090405', name: 'Moniepoint' },
}

export const ORG_TYPES: Record<string, string> = {
  '1': 'ESTATE',
  '2': 'COOPERATIVE',
  '3': 'GYM',
  '4': 'SCHOOL',
  '5': 'CLINIC',
  '6': 'OTHER',
}

export const CYCLE_TYPES: Record<string, string> = {
  '1': 'MONTHLY',
  '2': 'YEARLY',
  '3': 'ONE_TIME',
  '4': 'CUSTOM',
}

export interface PayoutPageData {
  balance: {
    totalCollected: number
    totalPayouts: number
    available: number
  }
  payouts: Payout[]
  payoutDestination: {
    bankName: string
    bankAccount: string
    last4: string
  }
}