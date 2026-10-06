"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, Check, Loader2 } from "lucide-react";
import { agentApi, type AgentMessage, type ProposedAction } from "@/lib/api/merchant";

const SUGGESTIONS: Record<string, string[]> = {
  overview: ["How did sales go this week?", "What needs my attention?"],
  orders: ["Which orders are waiting to ship?", "Accept all new paid orders"],
  products: ["Which products are low on stock?", "Draft a listing for a new product"],
  delivery: ["Which shipments are delayed?"],
  payments: ["How much can I withdraw?", "Request a payout of my available balance"],
  disputes: ["Which disputes are due soonest?", "Draft a response to my newest dispute"],
  messages: ["Summarise unread messages", "Draft replies to open conversations"],
};

/** Docked assistant. The agent only *proposes* actions; nothing runs until the merchant confirms. */
export function AgentPanel({ merchantId, section, open, onClose }: { merchantId: string; section: string; open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState(""); const [sending, setSending] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setInput(""); setSending(true); setMsgs(m => [...m, { role: "user", text }]);
    try {
      const r = await agentApi.chat(merchantId, text, { section });
      setMsgs(m => [...m, { role: "agent", text: r.reply, actions: r.proposed_actions }]);
    } catch { setMsgs(m => [...m, { role: "agent", text: "I couldn't reach the assistant. Try again in a moment." }]); }
    finally { setSending(false); }
  }

  async function decide(mi: number, a: ProposedAction, ok: boolean) {
    setWorking(a.id);
    let status: ProposedAction["status"] = ok ? "executed" : "dismissed";
    try { ok ? await agentApi.confirm(merchantId, a.id) : await agentApi.dismiss(merchantId, a.id); if (ok) window.dispatchEvent(new Event("merchant:refresh")); }
    catch { status = "failed"; }
    setMsgs(ms => ms.map((m, i) => i !== mi ? m : { ...m, actions: m.actions?.map(x => x.id === a.id ? { ...x, status } : x) }));
    setWorking(null);
  }

  if (!open) return null;
  return (
    <aside aria-label="Store assistant" className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-[var(--color-border)] bg-white shadow-xl sm:w-[380px]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2 font-medium"><Sparkles size={16} className="text-[var(--color-primary)]" />Store assistant</div>
        <button onClick={onClose} aria-label="Close assistant" className="rounded p-1 hover:bg-[var(--color-border)]"><X size={16} /></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {msgs.length === 0 && (<div className="space-y-2"><p className="text-[var(--color-muted)]">Ask about your store or have me do the work. I'll always ask before changing anything.</p>
          {(SUGGESTIONS[section] ?? SUGGESTIONS.overview).map(s => <button key={s} onClick={() => send(s)} className="block w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-left hover:bg-[var(--color-border)]">{s}</button>)}</div>)}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-8 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-white" : "mr-4 space-y-2"}>
            <p className="whitespace-pre-wrap">{m.text}</p>
            {m.actions?.map(a => (
              <div key={a.id} className={`rounded-lg border p-3 ${a.risk === "high" ? "border-[var(--color-danger-fg)]/40" : "border-[var(--color-border)]"}`}>
                <p className="font-medium">{a.label}</p><p className="text-xs text-[var(--color-muted)]">{a.summary}</p>
                {a.status === "proposed" ? (
                  <div className="mt-2 flex gap-2">
                    <button disabled={working === a.id} onClick={() => decide(i, a, true)} className="flex items-center gap-1 rounded-md bg-[var(--color-success)] px-3 py-1 text-xs font-medium text-white">{working === a.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}Confirm</button>
                    <button onClick={() => decide(i, a, false)} className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs">Not now</button></div>
                ) : <p className="mt-1 text-xs capitalize text-[var(--color-muted)]">{a.status === "executed" ? "Done" : a.status}</p>}
              </div>))}
          </div>))}
        {sending && <p className="flex items-center gap-2 text-[var(--color-muted)]"><Loader2 size={14} className="animate-spin" />Thinking…</p>}
        <div ref={end} />
      </div>
      <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-[var(--color-border)] p-3">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask or tell me what to do" className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
        <button disabled={sending || !input.trim()} aria-label="Send" className="rounded-lg bg-[var(--color-primary)] px-3 text-white disabled:opacity-50"><Send size={14} /></button>
      </form>
    </aside>
  );
}
