import crypto from "crypto";
import {
  PaymentProvider,
  VirtualAccountResult,
  TransferResult,
} from "./PaymentProviders";
import { env } from "../config/env";
import { logger } from "../lib/logger";

interface NombaAuthResponse {
  code: string;
  description: string;
  data: {
    businessId: string;
    access_token: string;
    refresh_token: string;
    expiresAt: string;
  };
}

interface NombaVirtualAccountResponse {
  code: string;
  description: string;
  data: {
    createdAt: string
    accountHolderId: string
    accountRef: string
    accountName: string
    currency: string
    bankName: string
    bankAccountNumber: string
    bankAccountName: string
    bvn?: string
    expired: boolean
  };
}

interface NombaTransferResponse {
  code: string;
  description: string;
  message?: string;
  status?: boolean;
  data: {
    id: string;
    status: "SUCCESS" | "PENDING_BILLING" | "NEW" | "REFUND" | "FAILED";
    amount?: number;
    type?: string;
  };
}



interface NombaBankLookupResponse {
  code: string;
  description: string;
  data: {
    accountNumber: string;
    accountName: string;
  };
}



export class NombaProvider implements PaymentProvider {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

  private get baseUrl(): string {
    return env.NOMBA_BASE_URL;
  }

  private get accountId(): string {
    if (!env.NOMBA_ACCOUNT_ID) {
      throw new Error("NOMBA_ACCOUNT_ID is not configured");
    }
    return env.NOMBA_ACCOUNT_ID;
  }

  private async issueToken(): Promise<void> {
    if (!env.NOMBA_CLIENT_ID || !env.NOMBA_CLIENT_SECRET) {
      throw new Error("NOMBA_CLIENT_ID and NOMBA_CLIENT_SECRET are required");
    }

    logger.info("[NombaProvider] Issuing new token with client credentials...");

    const response = await fetch(`${this.baseUrl}/v1/auth/token/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accountId: this.accountId,
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: env.NOMBA_CLIENT_ID,
        client_secret: env.NOMBA_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Nomba token issue failed [${response.status}]: ${body}`);
    }

    const result = (await response.json()) as NombaAuthResponse;

    if (result.code !== "00") {
      throw new Error(`Nomba auth error: ${result.description}`);
    }

    this.accessToken = result.data.access_token;
    this.refreshToken = result.data.refresh_token;
    this.tokenExpiresAt = new Date(result.data.expiresAt).getTime();

    const minutesRemaining = Math.round(
      (this.tokenExpiresAt - Date.now()) / 60_000,
    );

    logger.info(
      `[NombaProvider] Token issued — valid for ${minutesRemaining} minutes`,
    );
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshAccessToken) {
      return await this.issueToken();
    }

    logger.info("[NombaProvider] Refreshing access token...");

    const response = await fetch(`${this.baseUrl}/v1/auth/token/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        accountId: this.accountId,
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      logger.warn(
        `[NombaProvider] Token refresh failed [${response.status}] — falling back to full issue`,
      );
      this.refreshToken = null;
      return await this.issueToken();
    }

    const result = (await response.json()) as NombaAuthResponse;

    if (result.code !== "00") {
      logger.warn(
        `[NombaProvider] Token refresh returned error: ${result.description} — falling back to full issue`,
      );
      this.refreshToken = null;
      return await this.issueToken();
    }

    this.accessToken = result.data.access_token;
    this.refreshToken = result.data.refresh_token;
    this.tokenExpiresAt = new Date(result.data.expiresAt).getTime();

    const minutesRemaining = Math.round(
      (this.tokenExpiresAt - Date.now()) / 60_000,
    );

    logger.info(
      `[NombaProvider] Token refreshed — valid for ${minutesRemaining} minutes`,
    );
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (
      this.accessToken &&
      this.tokenExpiresAt > 0 &&
      now < this.tokenExpiresAt - this.TOKEN_REFRESH_BUFFER_MS
    ) {
      return this.accessToken;
    }

    if (!this.accessToken) {
      await this.issueToken();
      return this.accessToken!;
    }

    await this.refreshAccessToken();
    return this.accessToken!;
  }

  async revokeToken(): Promise<void> {
    if (!this.accessToken) return;

    try {
      await fetch(`${this.baseUrl}/v1/auth/token/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accountId: this.accountId,
        },
        body: JSON.stringify({
          clientId: env.NOMBA_CLIENT_ID,
          access_token: this.accessToken,
        }),
      });

      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiresAt = 0;

      logger.info("[NombaProvider] Token revoked successfully");
    } catch (error) {
      logger.warn(`[NombaProvider] Token revocation failed: ${error}`);
    }
  }

  private async buildHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accountId: this.accountId,
    };
  }

  async createVirtualAccount(
    ref: string,
    name: string,
    expectedAmount: number,
  ): Promise<VirtualAccountResult> {
    logger.info(
      `[NombaProvider] Creating virtual account — ref: ${ref}, name: ${name}, amount: ₦${expectedAmount}`,
    );

    const headers = await this.buildHeaders();

    const body: Record<string, unknown> = {
      accountRef: ref,
      accountName: name,
      currency: "NGN",
    };

    if (expectedAmount > 0) {
      body.expectedAmount = expectedAmount;
    }

    const response = await fetch(`${this.baseUrl}/v1/accounts/virtual`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as NombaVirtualAccountResponse;

    if (!response.ok || result.code !== "00") {
      logger.error(
        `[NombaProvider] Virtual account creation failed: ${JSON.stringify(result)}`,
      );
      throw new Error(
        `Failed to create virtual account: ${result.description || response.status}`,
      );
    }

    logger.info(
      `[NombaProvider] Virtual account created: ${result.data.bankAccountNumber} (${result.data.bankName})`,
    );

    return {
      accountNumber: result.data.bankAccountNumber,
      bankName: result.data.bankName,
    };
  }

  // ─── TRANSFER TO BANK ──────────────────────────────────────────────────────

  async transferToBank(
    amount: number,
    bankAccount: string,
    bankCode: string,
  ): Promise<TransferResult> {
    logger.info(
      `[NombaProvider] Initiating transfer of ₦${amount} to account ${bankAccount} (bank: ${bankCode})`,
    );

    const headers = await this.buildHeaders();

    // look up account name before transfer — required by Nomba
    const accountName = await this.lookupBankAccountPublic(bankAccount, bankCode);

    // generate unique idempotent merchant reference
    const merchantTxRef = `PAYFLOW-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase()}`;

    const response = await fetch(`${this.baseUrl}/v2/transfers/bank`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount,
        accountNumber: bankAccount,
        accountName,
        bankCode,
        merchantTxRef,
        senderName: "PayFlow",
        narration: "PayFlow Payout",
      }),
    });

    const result = (await response.json()) as NombaTransferResponse;

    // handle 201 PROCESSING — not a failure
    // per Nomba docs: rely on webhook for final status
    if (response.status === 201) {
      logger.info(
        `[NombaProvider] Transfer processing (201) — ref: ${merchantTxRef}`,
      );
      return {
        transferRef: merchantTxRef,
        status: "PROCESSING",
      };
    }

    if (!response.ok) {
      logger.error(
        `[NombaProvider] Transfer failed [${response.status}]: ${JSON.stringify(result)}`,
      );
      throw new Error(
        `Transfer failed: ${result.description || response.status}`,
      );
    }

    const transferStatus = result.data?.status;

    // REFUND means transfer failed and was reversed — safe to retry with new ref
    if (transferStatus === "REFUND") {
      logger.warn(`[NombaProvider] Transfer refunded — ref: ${merchantTxRef}`);
      throw new Error("Transfer was refunded by Nomba. Please retry.");
    }

    logger.info(
      `[NombaProvider] Transfer initiated — ref: ${merchantTxRef}, status: ${transferStatus}`,
    );

    return {
      transferRef: merchantTxRef,
      status: transferStatus || "PROCESSING",
    };
  }



async lookupBankAccountPublic(
    accountNumber: string,
    bankCode: string,
  ): Promise<string> {
    try {
      const headers = await this.buildHeaders();

      const response = await fetch(`${this.baseUrl}/v1/transfers/bank/lookup`, {
        method: "POST",
        headers,
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      const result = (await response.json()) as NombaBankLookupResponse;
      if (result.code === "00" && result.data?.accountName) {
        logger.info(
          `[NombaProvider] Bank lookup success: ${result.data.accountName}`,
        );
        return result.data.accountName;
      }

      logger.warn(
        `[NombaProvider] Bank lookup returned no name — using fallback`,
      );
      return "Account Holder";
    } catch (error) {
      logger.warn(
        `[NombaProvider] Bank lookup failed: ${error} — using fallback`,
      );
      return "Account Holder";
    }
  }


  async getBankList(): Promise<Array<{ code: string; name: string }>> {
    logger.info("[NombaProvider] Fetching bank list...");
    const headers = await this.buildHeaders();

    const response = await fetch(`${this.baseUrl}/v1/transfers/banks`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to fetch bank list [${response.status}]: ${body}`,
      );
    }

    const result = (await response.json()) as {
      code: string;
      description: string;
      data:
        | { results: Array<{ code: string; name: string }> }
        | Array<{ code: string; name: string }>;
    };

    if (result.code !== "00") {
      throw new Error(`Nomba bank list error: ${result.description}`);
    }

    const banks = Array.isArray(result.data)
      ? result.data
      : (result.data as { results: Array<{ code: string; name: string }> })
          .results ?? [];

    logger.info(`[NombaProvider] Fetched ${banks.length} banks`);

    return banks;
  }


  // ─── WEBHOOK SIGNATURE VERIFICATION ───────────────────────────────────────

  verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: string,
  ): boolean {
    const secret = env.NOMBA_WEBHOOK_SECRET;

    if (!secret) {
      logger.error(
        "[NombaProvider] NOMBA_WEBHOOK_SECRET not configured — rejecting all webhooks",
      );
      return false;
    }

    const receivedSignature = headers["nomba-signature"];

    if (!receivedSignature) {
      logger.warn("[NombaProvider] Missing nomba-signature header");
      return false;
    }

    if (!rawBody) {
      logger.warn("[NombaProvider] Raw body missing — cannot verify signature");
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    // timing-safe comparison — prevents timing attacks
    const received = Buffer.from(receivedSignature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");

    if (received.length !== expected.length) {
      logger.warn("[NombaProvider] Webhook signature length mismatch");
      return false;
    }

    const isValid = crypto.timingSafeEqual(received, expected);

    if (!isValid) {
      logger.warn(
        `[NombaProvider] Webhook signature verification failed — algorithm: HmacSHA256, version: ${headers["nomba-signature-version"] || "unknown"}`,
      );
    } else {
      logger.info(
        `[NombaProvider] Webhook verified — timestamp: ${headers["nomba-timestamp"]}, version: ${headers["nomba-signature-version"]}`,
      );
    }

    return isValid;
  }
}
