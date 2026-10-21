"use client";

import { useEffect } from "react";
import { CheckCircle, ArrowRight, X } from "lucide-react";
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
  // Dismiss the success modal with the Escape key.
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [onClose]);

  return (
    <div
      className="relative bg-white rounded-xl border border-[var(--color-success-fg)]/20 shadow-[var(--shadow)] max-w-md mx-auto max-h-[calc(100vh-4rem)] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Purchase complete"
    >
      {/* Always-reachable close affordance in the top-right corner. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-3 right-3 z-30 rounded-full p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-muted)]/10 hover:text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <X size={18} />
      </button>

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

      {/* Scrollable detail area: the order summary + tracker scroll inside the
          modal when they would otherwise push past the viewport, keeping the
          dismiss actions always visible. */}
      <div className="flex-1 overflow-y-auto px-6 py-6 border-t border-[var(--color-border)]">
        <OrderConfirmation order={order} />
        {showTracker && (
          <div className="mt-4 pt-2">
            <FulfillmentTracker order={order} />
          </div>
        )}
      </div>

      {/* Sticky footer keeps the dismiss CTA reachable while scrolling. */}
      <div className="sticky bottom-0 z-20 border-t border-[var(--color-border)] bg-white">
        <button
          type="button"
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