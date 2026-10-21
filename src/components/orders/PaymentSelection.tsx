"use client";

import { CreditCard, Wallet, WalletMinimal, Loader2 } from "lucide-react";
import { resolvePaymentCta } from "./paymentCta";

export type PaymentMethodKey = "paystack" | "pay_on_delivery";

export type PaymentMethod = {
  key: PaymentMethodKey;
  label: string;
  description: string;
};

export interface PaymentSelectionProps {
  methods: PaymentMethod[];
  selected: string | null;
  onSelect: (method: string) => void;
  /**
   * Called when the buyer taps "Proceed to Paystack" (selected === "paystack").
   * Typically wired to POST /payments/process and opening the returned
   * payment_url. When omitted the Paystack CTA is not rendered.
   */
  onPayNow?: () => void;
  /**
   * Called when the buyer confirms Pay on Delivery
   * (selected === "pay_on_delivery"). When omitted the Pay-on-delivery CTA
   * is not rendered.
   */
  onPayOnDelivery?: () => void;
  /** True while the payment request is in flight — disables the CTAs and shows a spinner. */
  loading?: boolean;
  /** Error from the last payment attempt, shown under the CTA. */
  error?: string | null;
}

type MethodInfo = {
  icon: React.ReactNode;
  /** Row classes applied when this method is selected. Static — Tailwind JIT must see full class names. */
  rowSelected: string;
  /** Icon-tile border classes when selected. */
  iconSelected: string;
  /** Radio-dot classes when selected. */
  dotSelected: string;
};

const METHOD_INFO: Record<PaymentMethodKey, MethodInfo> = {
  paystack: {
    icon: <CreditCard size={20} className="text-[var(--color-primary)]" />,
    rowSelected: "border-[var(--color-primary)] bg-[var(--color-primary)]/5",
    iconSelected: "border-[var(--color-primary)]",
    dotSelected: "border-[var(--color-primary)] bg-[var(--color-primary)]",
  },
  pay_on_delivery: {
    icon: <WalletMinimal size={20} className="text-[var(--color-warning-fg)]" />,
    rowSelected: "border-[var(--color-warning-fg)] bg-[var(--color-warning-bg)]/10",
    iconSelected: "border-[var(--color-warning-fg)]",
    dotSelected: "border-[var(--color-warning-fg)] bg-[var(--color-warning-fg)]",
  },
};

/** Neutral fallback so an unknown method key from the agent degrades gracefully. */
const UNKNOWN_METHOD_INFO: MethodInfo = {
  icon: <Wallet size={20} className="text-[var(--color-muted)]" />,
  rowSelected: "border-[var(--color-border)] bg-[var(--color-muted)]/10",
  iconSelected: "border-[var(--color-border)]",
  dotSelected: "border-[var(--color-border)] bg-[var(--color-muted)]",
};

function methodInfo(key: string | null): MethodInfo {
  if (key && key in METHOD_INFO) return METHOD_INFO[key as PaymentMethodKey];
  return UNKNOWN_METHOD_INFO;
}

export function PaymentSelection({
  methods,
  selected,
  onSelect,
  onPayNow,
  onPayOnDelivery,
  loading = false,
  error = null,
}: PaymentSelectionProps) {
  // The CTA only appears when a method is selected AND the caller supplied
  // the matching callback (e.g. no order_id yet -> no handler -> no CTA).
  const cta = resolvePaymentCta(selected, { onPayNow, onPayOnDelivery });
  const onPay = cta?.kind === "paystack" ? onPayNow : cta ? onPayOnDelivery : undefined;

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Wallet size={16} className="text-[var(--color-primary)]" />
          Choose how to pay
        </h3>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          Select your payment option to complete this order.
        </p>
      </div>
      <div role="radiogroup" aria-label="Payment method" className="relative divide-y divide-[var(--color-border)]">
        {methods.map((method) => {
          const isSelected = selected === method.key;
          const style = methodInfo(method.key);
          return (
            <button
              key={method.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={loading}
              onClick={() => onSelect(method.key)}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors disabled:opacity-60 ${
                isSelected ? style.rowSelected : "bg-white hover:bg-gray-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${
                    isSelected ? style.iconSelected : "border-[var(--color-border)]"
                  }`}
                >
                  {style.icon}
                </div>
                <div>
                  <span className="font-medium text-[var(--color-foreground)]">
                    {method.label}
                  </span>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {method.description}
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  isSelected ? style.dotSelected : "border-[var(--color-border)]"
                }`}
              />
            </button>
          );
        })}
        {loading && (
          <div
            role="status"
            className="absolute inset-0 z-10 flex items-center justify-center bg-white/75"
          >
            <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
            <span className="sr-only">Processing payment…</span>
          </div>
        )}
      </div>
      {cta && onPay && (
        <div className="px-5 py-4 border-t border-[var(--color-border)] space-y-2">
          <button
            type="button"
            onClick={onPay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {loading ? "Processing payment…" : cta.label}
          </button>
          {error && (
            <p role="alert" className="text-center text-xs text-[var(--color-danger-fg)]">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}