import { ArrowUpRight, ArrowDownLeft, Minus } from "lucide-react";

export interface LedgerEntry {
  id: string;
  type: "sale" | "payout" | "fee" | "refund";
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: "pending" | "settled";
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(Math.abs(amount) / 100);
}

const typeConfig = {
  sale: { label: "Sale", icon: <ArrowDownLeft size={12} />, color: "text-[var(--color-success-fg)]", bg: "bg-[var(--color-success-bg)]" },
  payout: { label: "Payout", icon: <ArrowUpRight size={12} />, color: "text-[var(--color-primary)]", bg: "bg-blue-50" },
  fee: { label: "Fee", icon: <Minus size={12} />, color: "text-[var(--color-muted)]", bg: "bg-gray-100" },
  refund: { label: "Refund", icon: <ArrowUpRight size={12} />, color: "text-[var(--color-danger-fg)]", bg: "bg-[var(--color-danger-bg)]" },
};

export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-[var(--color-foreground)]">Ledger Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Type</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Description</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Date</th>
              <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Amount</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {entries.map((entry) => {
              const t = typeConfig[entry.type] ?? typeConfig.fee;
              const isCredit = entry.amount > 0;
              return (
                <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.color} ${t.bg}`}>
                      {t.icon}{t.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--color-foreground)] max-w-xs truncate">{entry.description}</td>
                  <td className="px-5 py-3.5 text-[var(--color-muted)] text-xs font-[var(--font-mono)] whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-[var(--font-mono)] font-semibold ${isCredit ? "text-[var(--color-success-fg)]" : "text-[var(--color-danger-fg)]"}`}>
                    {isCredit ? "+" : "−"}{fmt(entry.amount, entry.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${entry.status === "settled" ? "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]" : "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]"}`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
