import { AlertCircle } from "lucide-react";

export function ErrorMessage({ message, rawData }: { message: string; rawData?: unknown }) {
  return (
    <div className="bg-[var(--color-danger-bg)] border border-[var(--color-danger-fg)]/20 rounded-xl p-4 max-w-sm">
      <div className="flex items-start gap-2">
        <AlertCircle size={15} className="text-[var(--color-danger-fg)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[var(--color-danger-fg)]">{message}</p>
          {rawData != null ? (
            <pre className="mt-2 text-[10px] font-[var(--font-mono)] text-[var(--color-danger-fg)]/70 overflow-auto max-h-24">
              {JSON.stringify(rawData as object, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
