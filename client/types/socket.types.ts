export interface PaymentReceivedEvent {
  memberName: string;
  identifier: string;
  amount: number;
  paidAt: string;
  txRef: string;
  reconciliationStatus: string;
}

export interface PaymentUnderpaymentEvent {
  memberName: string;
  identifier: string;
  expected: number;
  received: number;
  shortfall: number;
  timestamp: string;
}

export interface PaymentOverpaymentEvent {
  memberName: string;
  identifier: string;
  expected: number;
  received: number;
  excess: number;
  refundInitiated: boolean;
  timestamp: string;
  message: string;
}

export interface PayoutConfirmedEvent {
  amount: number;
  transferRef: string;
  timestamp: string;
}

export interface PayoutRefundedEvent {
  amount: number;
  message: string;
}
