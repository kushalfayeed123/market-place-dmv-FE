"use client";

import { CheckCircle, ArrowRight } from "lucide-react";
import { OrderConfirmation } from "./OrderConfirmation";
import { FulfillmentTracker } from "../fulfillment/FulfillmentTracker";


export interface OrderSuccessProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    total: { amount: number; currency: string };
    merchant_name: string;
    items?: {
      product_name: string;
      quantity: number;
      unit_price: { amount: number; currency: string };
    }[];
  };
  onClose: () => void;
  showTracker?: boolean;
}

export function OrderSuccess({ order, onClose, showTracker = true }: OrderSuccessProps) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-success-fg)]/20 shadow-[var(--shadow)] overflow-hidden max-w-md mx-auto">
      <div className="bg-[var(--color-success-bg)] px-6 py-8 flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[var(--color-success-fg)]/10 flex items-center justify-center mb-1">
          <CheckCircle size={36} className="text-[var(--color-success-fg)]" />
        </div>
        <h2 className="font-[var(--font-display)] text-2xl text-[var(--color-foreground)]">
          Purchase Complete!
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          Your order has been confirmed and payment accepted.
        </p>
        <span className="font-[var(--font-mono)] text-xl text-[var(--color-success-fg)]">
          #{order.order_number}
        </span>
      </div>

      <div className="px-6 py-6 border-t border-[var(--color-border)]">
        <OrderConfirmation order={order} />
      </div>

      {showTracker && (
        <div className="px-6 py-4 border-t border-[var(--color-border)]">
          <FulfillmentTracker order={order} />
        </div>
      )}

      <div className="px-6 py-6 border-t border-[var(--color-border)]">
        <button
          onClick={onClose}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRight size={16} />
          Back to store
        </button>
      </div>
    </div>
  );
}