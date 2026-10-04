import { AlertTriangle } from "lucide-react";

export function ConfirmationDialog({ title, message, tool_name, onConfirm, onCancel }: {
  title: string;
  message: string;
  tool_name?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-warning-fg)]/20 shadow-[var(--shadow-md)] overflow-hidden max-w-sm">
      <div className="px-5 py-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[var(--color-warning-bg)] flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-[var(--color-warning-fg)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-foreground)]">{title}</h3>
            {tool_name && <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-muted)] mt-0.5">Action: {tool_name}</p>}
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">{message}</p>
      </div>
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
