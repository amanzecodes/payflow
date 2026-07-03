import { Request, Response, NextFunction } from 'express'
import { paymentProvider } from '../providers'
import { AppError } from '../middleware/error.middleware'
import { logger } from '../lib/logger'

//cache the bank list
let bankListCache: Array<{ code: string; name: string }> | null = null
let bankListCachedAt: number = 0
const CACHE_TTL_MS = 60 * 60 * 1000 //1 hour

export class BanksController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = Date.now()

      if (bankListCache && now - bankListCachedAt < CACHE_TTL_MS) {
        logger.info('[BanksController] Returning cached bank list')
        res.json({ success: true, data: bankListCache })
        return
      }

      const banks = await paymentProvider.getBankList()

      bankListCache = banks
      bankListCachedAt = now

      logger.info(`[BanksController] Fetched and cached ${banks.length} banks`)

      res.json({ success: true, data: banks })
    } catch (error) {
      next(error)
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountNumber, bankCode } = req.body

      if (!accountNumber || !bankCode) {
        throw new AppError('accountNumber and bankCode are required', 400)
      }

      if (!/^\d{10}$/.test(accountNumber)) {
        throw new AppError('Account number must be exactly 10 digits', 400)
      }

      const accountName = await paymentProvider.lookupBankAccountPublic(
        accountNumber,
        bankCode
      )

      if (!accountName || accountName === 'Account Holder') {
        throw new AppError(
          'Could not verify account. Please check the details and try again.',
          400
        )
      }

      logger.info(
        `[BanksController] Account verified — ${accountNumber} → ${accountName}`
      )

      res.json({ success: true, data: { accountName, accountNumber } })
    } catch (error) {
      next(error)
    }
  }
}