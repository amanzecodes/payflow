import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'FCMB Group', code: '070' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Fidelity Bank', code: '070' },
]

const verifyAccountSchema = z.object({
  accountNumber: z.string().length(10, 'Account number must be 10 digits'),
  bankCode: z.string().min(1),
})

export class BanksController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: NIGERIAN_BANKS })
    } catch (error) {
      next(error)
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountNumber, bankCode } = verifyAccountSchema.parse(req.body)

      // Mock verification — in production, call Nomba's resolve API
      // For now, generate a plausible name based on account number hash
      const nameOptions = [
        'John Doe Ltd',
        'Sarah Smith Trading',
        'ABC Holdings',
        'Business Ventures Co',
        'Enterprise Solutions',
        'Tech Innovations Ltd',
      ]
      const idx = parseInt(accountNumber.slice(-1)) % nameOptions.length
      const accountName = nameOptions[idx]

      res.status(200).json({
        success: true,
        data: { accountName }
      })
    } catch (error) {
      next(error)
    }
  }
}
