"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Search, Plus } from "lucide-react";
import { mreq } from "@/lib/api/merchant";
import type { SectionConfig, RowAction } from "./sections";

const money = (n: number, c = "NGN") => new Intl.NumberFormat("en-NG", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n / 100);
const tone = (s: string) =>
  ["paid", "delivered", "active", "won", "resolved", "fulfilled", "shipped"].includes(s) ? "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]"
  : ["failed", "lost", "cancelled", "refunded", "open", "unread", "suspended"].includes(s) ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]"
  : "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]";

export function ResourceSection({ cfg, merchantId }: { cfg: SectionConfig; merchantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<{ row: any; act: RowAction } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
        try { const d = await mreq<any>("GET", cfg.list!(merchantId, { search, status })); setRows(!d ? [] : Array.isArray(d) ? d : (d.items ?? [])); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't load this list. Try again."); }
    finally { setLoading(false); }
  }, [cfg, merchantId, search, status]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  // The agent fires this after it executes an action, so manual and agent paths stay in sync.
  useEffect(() => { window.addEventListener("merchant:refresh", load); return () => window.removeEventListener("merchant:refresh", load); }, [load]);

  async function run(row: any, act: RowAction) {
    setBusy(true); setErr(null);
    try { await mreq(act.method, act.path(row), act.body?.(row)); setPending(null); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : `${act.label} failed.`); }
    finally { setBusy(false); }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-[var(--color-foreground)]">{cfg.label}</h1>
          <p className="text-sm text-[var(--color-muted)]">{cfg.hint}</p></div>
        <div className="flex items-center gap-2">
          <button onClick={load} aria-label="Refresh" className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-muted)] hover:bg-[var(--color-border)]"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
          {cfg.primary && <Link href={cfg.primary.href!} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white"><Plus size={14} />{cfg.primary.label}</Link>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}`} className="w-60 rounded-lg border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" /></div>
        {["", ...(cfg.statuses ?? [])].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs capitalize ${status === s ? "bg-[var(--color-foreground)] text-white" : "border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-border)]"}`}>{s ? s.replace(/_/g, " ") : "All"}</button>
        ))}
      </div>

      {err && <div role="alert" className="rounded-lg bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger-fg)]">{err}</div>}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[var(--color-border)] bg-gray-50 text-left text-xs font-medium text-[var(--color-muted)]">
            {cfg.columns!.map(c => <th key={c.key} className={`px-4 py-3 ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>)}<th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {!loading && rows.length === 0 && <tr><td colSpan={cfg.columns!.length + 1} className="px-4 py-10 text-center text-[var(--color-muted)]">{search || status ? "Nothing matches these filters." : cfg.emptyText}</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50/60">
                {cfg.columns!.map(c => (
                  <td key={c.key} className={`px-4 py-3 ${c.align === "right" ? "text-right font-medium" : ""}`}>
                    {c.kind === "money" ? money(r[c.key], r.currency)
                      : c.kind === "date" ? (r[c.key] ? new Date(r[c.key]).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "—")
                      : c.kind === "badge" ? <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${tone(r[c.key])}`}>{String(r[c.key]).replace(/_/g, " ")}</span>
                      : <span className="block max-w-xs truncate">{r[c.key] ?? "—"}</span>}
                  </td>))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                                        {cfg.actions?.filter(a => !a.when || a.when(r)).map(a => pending?.row.id === r.id && pending?.act === a ? (
                      <span key={a.label} className="flex items-center gap-1.5 text-xs">{a.confirm}
                        <button disabled={busy} onClick={() => run(r, a)} className="rounded bg-[var(--color-danger-fg)] px-2 py-1 text-white">Yes</button>
                        <button onClick={() => setPending(null)} className="px-1 text-[var(--color-muted)]">No</button></span>
                    ) : (
                      <button key={a.label} onClick={() => a.confirm ? setPending({ row: r, act: a }) : run(r, a)}
                        className={`rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs hover:bg-[var(--color-border)] ${a.tone === "danger" ? "text-[var(--color-danger-fg)]" : "text-[var(--color-foreground)]"}`}>{a.label}</button>))}
                  </div>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
