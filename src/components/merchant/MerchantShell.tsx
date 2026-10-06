"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";
import { LogOut, ChevronLeft, Sparkles, Store } from "lucide-react";
import { SECTIONS } from "./sections";
import { AgentPanel } from "./AgentPanel";

/** Sidebar nav (bottom-scroll bar on mobile) + content + dockable assistant. Section lives in ?section=. */
export function MerchantShell({ merchantId, businessName, section, onLogout, children }:
  { merchantId: string; businessName: string; section: string; onLogout: () => void; children: ReactNode }) {
  const [agentOpen, setAgentOpen] = useState(false);
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <nav aria-label="Merchant sections" className="md:sticky md:top-6 md:h-fit md:w-52 md:shrink-0">
        <div className="mb-3 hidden items-center gap-2 px-2 md:flex"><Store size={16} className="text-[var(--color-primary)]" /><span className="truncate text-sm font-semibold">{businessName}</span></div>
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map(s => { const on = s.key === section; return (
            <li key={s.key}><Link href={`?section=${s.key}`} aria-current={on ? "page" : undefined}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${on ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]" : "text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]"}`}>
              <s.icon size={15} />{s.label}</Link></li>); })}
        </ul>
        <div className="mt-4 hidden space-y-1 border-t border-[var(--color-border)] pt-3 md:block">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"><ChevronLeft size={12} />Back to marketplace</Link>
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"><LogOut size={12} />Sign out</button>
        </div>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
      {!agentOpen && <button onClick={() => setAgentOpen(true)} className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white shadow-lg"><Sparkles size={16} />Ask assistant</button>}
      <AgentPanel merchantId={merchantId} section={section} open={agentOpen} onClose={() => setAgentOpen(false)} />
    </div>
  );
}
