"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";
import type {
  PaymentReceivedEvent,
  PaymentUnderpaymentEvent,
  PaymentOverpaymentEvent,
  PayoutConfirmedEvent,
  PayoutRefundedEvent,
} from "@/types/socket.types";

// Socket.io connects directly to the server root — no /api/v1 prefix.
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/v1\/?$/, "");

interface LiveDashboardListenerProps {
  orgId: string;
  onPaymentReceived: (payment: PaymentReceivedEvent) => void;
  onPaymentUnderpaid: (event: PaymentUnderpaymentEvent) => void;
  onPaymentOverpaid: (event: PaymentOverpaymentEvent) => void;
}

const LiveDashboardListener = ({
  orgId,
  onPaymentReceived,
  onPaymentUnderpaid,
  onPaymentOverpaid,
}: LiveDashboardListenerProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

 
  const onPaymentReceivedRef = useRef(onPaymentReceived);
  const onPaymentUnderpaidRef = useRef(onPaymentUnderpaid);
  const onPaymentOverpaidRef = useRef(onPaymentOverpaid);

  useEffect(() => {
    onPaymentReceivedRef.current = onPaymentReceived;
    onPaymentUnderpaidRef.current = onPaymentUnderpaid;
    onPaymentOverpaidRef.current = onPaymentOverpaid;
  });

  useEffect(() => {
    if (!orgId || !SOCKET_URL) return;

    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.emit("join:org", orgId);

    const syncServerState = () => {
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["dashboard_data", orgId] });
    };

    socket.on("payment:received", (payload: PaymentReceivedEvent) => {
      onPaymentReceivedRef.current(payload);
      setTimeout(syncServerState, 2000);
    });

    socket.on("payment:underpayment", (payload: PaymentUnderpaymentEvent) => {
      onPaymentUnderpaidRef.current(payload);
      toast.warning(`${payload.memberName} underpaid by ₦${payload.shortfall.toLocaleString()}`);
    });

    socket.on("payment:overpayment", (payload: PaymentOverpaymentEvent) => {
      onPaymentOverpaidRef.current(payload);
      toast.custom(() => (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
          <p className="text-sm font-medium text-orange-800">{payload.message}</p>
        </div>
      ));
      setTimeout(syncServerState, 2000);
    });

    socket.on("payout:confirmed", (payload: PayoutConfirmedEvent) => {
      toast.success(`Payout of ₦${payload.amount.toLocaleString()} confirmed`);
      syncServerState();
    });

    socket.on("payout:refunded", (payload: PayoutRefundedEvent) => {
      toast.error(payload.message);
      syncServerState();
    });

    return () => {
      socket.disconnect();
    };
  }, [orgId, router, queryClient]);

  return null;
};

export default LiveDashboardListener;
