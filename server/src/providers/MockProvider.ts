import { logger } from "../lib/logger";
import {
    BalanceResult,
  PaymentProvider,
  TransferResult,
  VirtualAccountResult,
} from "./PaymentProviders";

export class MockProvider implements PaymentProvider {
  async createVirtualAccount(
    ref: string,
    name: string,
    expectedAmount: number,
  ): Promise<VirtualAccountResult> {
    const accountNumber = `9391${Math.floor(Math.random() * 9000000 + 1000000)}`;
    logger.info(
      `[MockProvider] Virtual account created for ${name} — ${accountNumber}`,
    );
    return { accountNumber, bankName: "Nomba (Nombank MFB)" };
  }

  async transferToBank(
    amount: number,
    bankAccount: string,
    bankCode: string,
  ): Promise<TransferResult> {
    logger.info(
      `[MockProvider] Transfer ₦${amount} → ${bankAccount} (${bankCode})`,
    );
    return { transferRef: `MOCK-TRF-${Date.now()}`, status: "completed" };

  }

  async getParentBalance(): Promise<BalanceResult> {
    return { balance: 9_999_999 }
  }

  verifyWebhookSignature(payload: unknown, headers: Record<string, string>): boolean {
    return true
  }

  }


