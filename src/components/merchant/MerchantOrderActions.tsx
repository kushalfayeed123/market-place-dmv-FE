import { AlertCircle, Loader2 } from "lucide-react";
import { getOrderActions, type OrderAction } from "@/components/merchant/orderActions";
import { statusLabel } from "@/components/merchant/orderDetailUtils";

interface MerchantOrderActionsProps {
  status: string;
  busy: boolean;
  pendingAction: OrderAction | null;
  /** Click on an action button: enters confirm mode if `action.confirm` is set, else runs it. */
  onActionClick: (action: OrderAction) => void;
  /** Confirmed an action that required a confirmation step — actually runs it. */
  onConfirm: (action: OrderAction) => void;
  /** Dismiss a pending confirmation. */
  onCancelConfirm: () => void;
}

/** Action buttons for a merchant on an order detail page. */
export function MerchantOrderActions({
  status,
  busy,
  pendingAction,
  onActionClick,
  onConfirm,
  onCancelConfirm,
}: MerchantOrderActionsProps) {
  const terminal = ["fulfilled", "cancelled", "refunded"].includes(status);

  if (terminal) {
    return (
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
          Order actions
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          This order is {statusLabel(status).toLowerCase()}; no further actions
          are available.
        </p>
      </section>
    );
  }

  const available = getOrderActions(status);

  if (available.length === 0) {
    return (
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
          Order actions
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          No actions are available for this status.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
        Order actions
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        {available.map((action) => {
          const isPending = pendingAction?.key === action.key;
          return (
            <div key={action.key} className="inline-flex flex-col gap-2">
              {isPending ? (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-gray-50 px-3 py-2">
                  <AlertCircle size={16} className="text-[var(--color-warning-fg)]" />
                  <span className="text-xs text-[var(--color-foreground)]">
                    {action.confirm}
                  </span>
                  <button
                    onClick={() => onConfirm(action)}
                    disabled={busy}
                    className="rounded bg-[var(--color-success-fg)] px-2 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {busy && <Loader2 size={12} className="animate-spin" />}
                    Yes
                  </button>
                  <button
                    onClick={onCancelConfirm}
                    disabled={busy}
                    className="px-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onActionClick(action)}
                  disabled={busy}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    action.tone === "danger"
                      ? "border-[var(--color-danger-fg)] text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-bg)]"
                      : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]"
                  } disabled:opacity-50`}
                >
                  {action.label}
                </button>
              )}
            </div>
          );
        })}
        {busy && (
          <span className="text-xs text-[var(--color-muted)]">Applying…</span>
        )}
      </div>
    </section>
  );
}

