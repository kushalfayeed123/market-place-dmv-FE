"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError } from "@/lib/api/client";
import type { MerchantResponse, LedgerBalance, LedgerEntryResponse } from "@/lib/api/client";
import type { LedgerEntry } from "@/components/merchant/LedgerTable";
import { MerchantRouteGuard } from "@/components/merchant/MerchantRouteGuard";
import { MerchantBalanceCard } from "@/components/merchant/MerchantBalanceCard";
import { MerchantSetupForm } from "@/components/merchant/MerchantSetupForm";
import { LedgerTable } from "@/components/merchant/LedgerTable";
import { MerchantShell } from "@/components/merchant/MerchantShell";
import { ResourceSection } from "@/components/merchant/ResourceSection";
import { SECTIONS } from "@/components/merchant/sections";
import { mreq } from "@/lib/api/merchant";
import { RefreshCw, Store } from "lucide-react";

function toLedgerEntry(e: LedgerEntryResponse): LedgerEntry {
  const typeMap: Record<string, LedgerEntry["type"]> = {
    sale: "sale", payout_release: "payout", payout_paid: "payout",
    payout_hold: "fee", commission: "fee", refund: "refund", adjustment: "fee",
  };
  const amount = e.direction === "credit" ? e.amount : -Math.abs(e.amount);
  const desc = typeof e.metadata?.description === "string" ? e.metadata.description
    : typeof e.metadata?.note === "string" ? e.metadata.note
    : `${e.entry_type}${e.order_id ? " · order " + e.order_id : ""}`;
  return { id: e.id, type: typeMap[e.entry_type] ?? "fee", description: desc, amount, currency: e.currency, date: e.created_at, status: amount > 0 ? "settled" : "pending" };
}

// Needs-attention counts drive the "To do" strip. Endpoint: GET /merchants/{id}/attention
interface Attention { orders_to_fulfil: number; disputes_due: number; unread_messages: number; low_stock: number }

function Overview({ merchant, balance, entries, attention, reload }:
  { merchant: MerchantResponse; balance: LedgerBalance | null; entries: LedgerEntry[]; attention: Attention | null; reload: () => void }) {
  const todo = attention ? [
    { n: attention.orders_to_fulfil, label: "orders to fulfil", to: "orders" },
    { n: attention.disputes_due, label: "disputes need a response", to: "disputes" },
    { n: attention.unread_messages, label: "unread messages", to: "messages" },
    { n: attention.low_stock, label: "products low on stock", to: "products" },
  ].filter(t => t.n > 0) : [];
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[var(--color-foreground)]">Overview</h1>
      {todo.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {todo.map(t => <a key={t.to} href={`?section=${t.to}`} className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm hover:bg-[var(--color-border)]"><b>{t.n}</b> {t.label}</a>)}
        </div>)}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><Store size={20} /></div>
        <div className="min-w-0 flex-1"><p className="font-medium">{merchant.business_name}</p>
          <p className="text-xs text-[var(--color-muted)]">Slug: {merchant.slug} · KYC: <span className="capitalize">{merchant.kyc_status}</span></p></div>
      </div>
      {balance && <MerchantBalanceCard merchant_name={merchant.business_name}
        available_balance={{ amount: balance.available_balance, currency: balance.currency }}
        pending_balance={{ amount: balance.held_balance, currency: balance.currency }}
        total_earned={{ amount: balance.total_balance, currency: balance.currency }}
        last_payout={{ amount: 0, currency: balance.currency, date: balance.calculated_at }}
        next_payout_date={balance.calculated_at} />}
      {entries.length === 0
        ? <div className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-8 text-center text-sm text-[var(--color-muted)]">No ledger entries yet.</div>
        : <LedgerTable entries={entries} />}
      <div className="flex justify-end"><button onClick={reload} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-border)]"><RefreshCw size={12} />Refresh</button></div>
    </div>
  );
}

function MerchantDashboardContent() {
  const { user, logout } = useAuth();
  const section = useSearchParams().get("section") ?? "overview";
  const [merchant, setMerchant] = useState<MerchantResponse | null>(null);
  const [balance, setBalance] = useState<LedgerBalance | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [attention, setAttention] = useState<Attention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);
  useEffect(() => { window.addEventListener("merchant:refresh", loadData); return () => window.removeEventListener("merchant:refresh", loadData); });

  async function loadData() {
    if (!user?.id) return;
    setLoading(true); setError(null); setNeedsSetup(false);
    try {
      const m = await apiClient.getMyMerchant(user.id); setMerchant(m);
      const [b, raw, att] = await Promise.all([
        apiClient.getMerchantBalance(m.id), apiClient.getLedgerEntries(m.id),
        mreq<Attention>("GET", `/merchants/${m.id}/attention`).catch(() => null), // non-blocking
      ]);
      setBalance(b); setEntries(raw.map(toLedgerEntry)); setAttention(att);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNeedsSetup(true);
      else setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
    } finally { setLoading(false); }
  }

  if (loading && !merchant) return <div className="flex items-center gap-2 text-[var(--color-muted)]"><RefreshCw size={14} className="animate-spin" /><span>Loading dashboard…</span></div>;
  if (needsSetup) return <MerchantSetupForm onSuccess={() => { setNeedsSetup(false); loadData(); }} />;
  if (!merchant) return <div role="alert" className="rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-fg)]">{error}</div>;

  const cfg = SECTIONS.find(s => s.key === section);
  return (
        <MerchantShell merchantId={merchant.id} businessName={merchant.business_name} section={cfg ? section : "overview"} kycStatus={merchant.kyc_status} onLogout={() => logout().catch(() => {})}>
      {error && <div role="alert" className="mb-4 rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-fg)]">{error}</div>}
      {!cfg || cfg.key === "overview"
        ? <Overview merchant={merchant} balance={balance} entries={entries} attention={attention} reload={loadData} />
        : <ResourceSection key={cfg.key} cfg={cfg} merchantId={merchant.id} />}
    </MerchantShell>
  );
}

export function MerchantDashboard() {
  return <MerchantRouteGuard><MerchantDashboardContent /></MerchantRouteGuard>;
}