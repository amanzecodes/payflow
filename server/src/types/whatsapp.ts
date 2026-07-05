import { ConversationSession } from "../generated/prisma/client";

export interface TwilioWebhookPayload {
  MessageSid: string
  AccountSid: string
  From: string
  To: string
  Body: string
  NumMedia: string
  ProfileName?: string
  WaId?: string
}

export interface ConversationContext {
  orgName?: string
  orgType?: string
  collectionName?: string
  cycle?: string
  structure?: string
  flatAmount?: number
  feeLines?: Array<{ name: string; amount: number }>
  payoutBankAccount?: string
  payoutBankCode?: string
  payoutBankName?: string
  payoutAccountName?: string
  pendingMemberName?: string
  selectedFeeLineIds?: string[]
  webEmail?: string
  popularBankCodes?: string[]
  awaitingBankSelection?: boolean
  oneTimeDueDate?: string
  customDueDate?: string
  pendingNewCycleDueDate?: string
}

export type TypedSession = Omit<ConversationSession, 'context'> & {
  context: ConversationContext
}