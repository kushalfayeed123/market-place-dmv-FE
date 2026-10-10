import { CheckCircle2, Circle } from "lucide-react";
import type { ReadinessItem } from "./productUtils";

export function ListingChecklist({ items, ready }: { items: ReadinessItem[]; ready: boolean }) {
  const open = items.filter((i) => i.required && !i.ok).length;
  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (ready
          ? "border-emerald-200 bg-[var(--color-success-bg)]"
          : "border-[var(--color-border)] bg-slate-50")
      }
    >
      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        {ready ? "Ready to list on the marketplace" : `${open} ${open === 1 ? "thing" : "things"} to finish before listing`}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.key} className="flex items-start gap-2.5 text-sm">
            {i.ok ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
            ) : (
              <Circle size={18} className="mt-0.5 shrink-0 text-slate-300" />
            )}
            <span>
              <span className={i.ok ? "text-[var(--color-foreground)]" : "font-medium text-[var(--color-foreground)]"}>
                {i.label}
              </span>
              {!i.required && <span className="ml-1.5 text-xs text-[var(--color-muted)]">recommended</span>}
              {!i.ok && <span className="block text-[var(--color-muted)]">{i.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
