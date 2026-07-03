import { paymentProvider } from '../providers'
import { logger } from './logger'

export interface Bank {
  code: string
  name: string
}

// top 10 most common Nigerian banks — shown as numbered list in WhatsApp
// names match exactly what Nomba returns so matching is deterministic
export const POPULAR_BANKS = [
  'GTBank',
  'Access Bank',
  'Zenith Bank',
  'United Bank for Africa',
  'First Bank of Nigeria',
  'First City Monument Bank',
  'Kuda Microfinance Bank',
  'Paycom (Opay)',
  'Palmpay',
  'Moniepoint Bank',
]

let cachedBanks: Bank[] | null = null

export async function getBanks(): Promise<Bank[]> {
  if (cachedBanks) return cachedBanks

  try {
    const result = await paymentProvider.getBankList()
    // filter out entries with empty codes or whitespace in codes
    cachedBanks = result.filter(b => b.code && b.code.trim().length > 0)
    logger.info(`[BankCache] Loaded ${cachedBanks.length} banks from Nomba`)
    return cachedBanks
  } catch (error) {
    logger.warn(`[BankCache] Failed to fetch from Nomba — returning empty list: ${error}`)
    return []
  }
}

export async function getPopularBanks(): Promise<Bank[]> {
  const banks = await getBanks()
  return POPULAR_BANKS
    .map(name => banks.find(b => b.name === name))
    .filter((b): b is Bank => b !== undefined)
}

export async function findBankByName(input: string): Promise<Bank | null> {
  const banks = await getBanks()
  const query = input.toLowerCase().trim()

  // 1. exact match — "gtbank" === "gtbank"
  const exact = banks.find(b => b.name.toLowerCase() === query)
  if (exact) return exact

  // 2. partial match — "kuda" is in "kuda microfinance bank"
  const partial = banks.find(b => b.name.toLowerCase().includes(query))
  if (partial) return partial

  // 3. reverse partial — "opay" is in "paycom (opay)"
  const reverse = banks.find(b => query.includes(b.name.toLowerCase()))
  if (reverse) return reverse

  return null
}

export async function findBankByCode(code: string): Promise<Bank | null> {
  const banks = await getBanks()
  return banks.find(b => b.code.trim() === code.trim()) ?? null
}