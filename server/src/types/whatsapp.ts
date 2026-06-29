import { ConversationSession } from "../generated/prisma/client";

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  ProfileName?: string;
  WaId?: string;
}

export interface ConversationContext {
  orgName?: string;
  orgType?: string;
  collectionName?: string;
  cycle?: string;
  structure?: string;
  flatAmount?: number;
  feeLines?: Array<{ name: string; amount: number }>;
  payoutBankAccount?: string;
  payoutBankCode?: string;
  payoutBankName?: string;
  payoutAccountName?: string;
  pendingMemberName?: string;
  pendingMemberIdentifier?: string;
  pendingBankAccount?: string;
  pendingBankCode?: string;
  selectedFeeLineIds?: string[];
  webEmail?: string
}

export type TypedSession = Omit<ConversationSession, "context"> & {
  context: ConversationContext;
};
