import { TrendingUp, Clock, Banknote, CalendarCheck } from "lucide-react";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function MerchantBalanceCard({ merchant_name, available_balance, pending_balance, total_earned, last_payout, next_payout_date }: {
  merchant_name: string;
  available_balance: { amount: number; currency: string };
  pending_balance: { amount: number; currency: string };
  total_earned: { amount: number; currency: string };
  last_payout: { amount: number; currency: string; date: string };
  next_payout_date: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow)] overflow-hidden">
      <div className="bg-[var(--color-sidebar)] px-5 py-5 text-white">
        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Merchant Balance</p>
        <p className="font-[var(--font-display)] text-sm text-white/70 mb-3">{merchant_name}</p>
        <div className="text-4xl font-[var(--font-mono)] font-bold">
          {fmt(available_balance.amount, available_balance.currency)}
        </div>
        <p className="text-xs text-white/50 mt-1">Available for withdrawal</p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
        {[
          { label: "Pending", value: fmt(pending_balance.amount, pending_balance.currency), icon: <Clock size={13} />, color: "text-[var(--color-warning-fg)]" },
          { label: "Total Earned", value: fmt(total_earned.amount, total_earned.currency), icon: <TrendingUp size={13} />, color: "text-[var(--color-success-fg)]" },
          { label: "Last Payout", value: fmt(last_payout.amount, last_payout.currency), icon: <Banknote size={13} />, color: "text-[var(--color-primary)]" },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-4 text-center">
            <div className={`flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide mb-1 ${stat.color}`}>
              {stat.icon}{stat.label}
            </div>
            <div className="font-[var(--font-mono)] font-semibold text-sm text-[var(--color-foreground)]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <CalendarCheck size={14} className="text-[var(--color-success-fg)]" />
          Next payout: <span className="font-medium text-[var(--color-foreground)]">{new Date(next_payout_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <button className="px-4 py-2 bg-[var(--color-success)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          Request Payout
        </button>
      </div>
    </div>
  );
}
