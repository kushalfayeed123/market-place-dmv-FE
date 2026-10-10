import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

export const inputCls =
  "h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-3.5 text-[15px] text-[var(--color-foreground)] outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-[invalid=true]:border-[var(--color-danger)]";
export const textareaCls = inputCls.replace("h-11 ", "min-h-[132px] py-2.5 leading-relaxed ");

export function Section({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-[var(--color-muted)]">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-[var(--color-danger-fg)]">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-[var(--color-muted)]">{hint}</p>
      )}
    </div>
  );
}

const TONES = {
  error: { cls: "border-red-200 bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]", Icon: AlertCircle },
  warning: { cls: "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]", Icon: TriangleAlert },
  success: { cls: "border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-fg)]", Icon: CheckCircle2 },
  info: { cls: "border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-foreground)]", Icon: Info },
} as const;

export function Notice({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  const { cls, Icon } = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-2.5 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ChoiceCards<T extends string>({
  name,
  value,
  onChange,
  options,
  disabled,
  columns = 3,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  disabled?: boolean;
  columns?: 2 | 3;
}) {
  return (
    <div role="radiogroup" className={"grid gap-2 " + (columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {options.map((o) => (
        <label key={o.value} className="relative block cursor-pointer">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            disabled={disabled}
            onChange={() => onChange(o.value)}
            className="peer sr-only"
          />
          <div className="h-full rounded-xl border border-[var(--color-border)] bg-white p-3 transition peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary-soft)] peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--color-primary-soft)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{o.label}</p>
            {o.hint && <p className="mt-0.5 text-xs leading-snug text-[var(--color-muted)]">{o.hint}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}
