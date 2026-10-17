"use client";

import { useState, useRef, useEffect, type ReactNode, type FormEvent } from "react";
import { Send, Sparkles, Trash2, ChevronDown, Loader2 } from "lucide-react";
import type { UiDirective } from "@/types/components";
import { ProductGridSkeleton } from "../catalog/ProductGrid";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content?: string;
  directive?: UiDirective;
  timestamp: Date;
}

const COLLAPSIBLE = new Set(["ProductGrid", "ProductDetail", "CartSummary"]);

/** `inert` blocks mouse, keyboard and assistive-tech interaction (React 18 has no typed prop for it). */
const inertProps = (on: boolean) => (on ? ({ inert: "" } as Record<string, string>) : {});

function summarize(d: UiDirective): string {
  const p = d.props as Record<string, unknown>;
  if (d.component === "ProductGrid") {
    const items = Array.isArray(p.items) ? p.items : Array.isArray(p.products) ? p.products : [];
    const q = typeof p.query === "string" && p.query ? `Results for “${p.query}”` : "Earlier results";
    return `${q} · ${items.length} ${items.length === 1 ? "item" : "items"}`;
  }
  if (d.component === "CartSummary") {
    const n = Number(p.item_count);
    return `Earlier cart${Number.isFinite(n) ? ` · ${n} ${n === 1 ? "item" : "items"}` : ""}`;
  }
  if (d.component === "PaymentCapturePanel") {
    const payment = p.payment as { status?: string } | undefined;
    const status = String(p.status ?? payment?.status ?? "unknown");
    return `Payment ${status === "success" || status === "paid" ? "complete" : `• ${status}`}`;
  }
  return `Viewed ${typeof p.name === "string" ? p.name : "a product"}`;
}

function AgentAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-agent-soft)] text-[var(--color-agent)]">
      <Sparkles size={15} />
    </div>
  );
}

/** One bubble component for BOTH the live (streaming) text and the committed message, so the swap is invisible. */
function AgentBubble({ children, live }: { children: ReactNode; live?: boolean }) {
  return (
    <div className="flex gap-2.5">
      <AgentAvatar />
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm leading-relaxed">
        {children}
        {live && (
          <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-[var(--color-agent)]" />
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Agent is typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </span>
  );
}

/** Reserves space for the results that are being held until the agent finishes talking. */
function ResultsPlaceholder({ kinds }: { kinds: string[] }) {
  if (kinds.some((k) => k === "ProductGrid" || k === "ProductCard" || k === "CategoryList")) {
    return <ProductGridSkeleton count={5} />;
  }
    if (kinds.includes("ProductDetail")) {
    return <div aria-hidden="true" className="h-72 animate-pulse rounded-2xl bg-slate-100" />;
  }
  if (kinds.includes("PaymentCapturePanel")) {
    return <div aria-hidden="true" className="h-40 animate-pulse rounded-2xl bg-slate-100 w-full max-w-md" />;
  }
  return <div aria-hidden="true" className="h-24 animate-pulse rounded-2xl bg-slate-100" />;
}

export interface AgentTranscriptProps {
  messages: ChatMessage[];
  /** True from the moment a message is sent until the agent has fully finished. Locks all actions. */
  isSearching?: boolean;
  /** Live text of the reply that is currently streaming. */
  statusText?: string | null;
  /** Components of results received but held back until the reply is complete. */
  pendingKinds?: string[];
  starters?: string[];
  onSend: (message: string) => void;
  onClear?: () => void;
  /** `isLatest` is false for older results of the same type, which should be read-only. */
  renderDirective?: (directive: UiDirective, meta: { id: string; isLatest: boolean }) => ReactNode;
}

export function AgentTranscript({
  messages,
  isSearching = false,
  statusText,
  pendingKinds = [],
  starters,
  onSend,
  onClear,
  renderDirective,
}: AgentTranscriptProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const prevCount = useRef(0);
  const liveRef = useRef<HTMLDivElement>(null);

  // When messages are added, bring the FIRST new one into view. For an agent reply that is the
  // text summary, so the summary and the start of the results are visible together.
  useEffect(() => {
    const prev = prevCount.current;
    if (messages.length > prev) {
      const target = messages[prev];
      document
        .getElementById(`msg-${target.id}`)
        ?.scrollIntoView({ block: target.role === "agent" ? "start" : "nearest" });
    }
    prevCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (isSearching) liveRef.current?.scrollIntoView({ block: "nearest" });
  }, [isSearching]);

  const lastIndexByComponent = new Map<string, number>();
  messages.forEach((m, i) => {
    if (m.directive && COLLAPSIBLE.has(m.directive.component)) lastIndexByComponent.set(m.directive.component, i);
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (messages.length === 0 && !isSearching) {
    return starters?.length ? (
      <div className="rounded-3xl bg-[var(--color-primary-soft)] px-6 py-10 text-center sm:py-14">
        <h1 className="text-2xl font-semibold sm:text-3xl">What are you shopping for?</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
          Describe it in your own words, including budget and use. The agent searches the whole marketplace.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {starters.map((s) => (
            <button key={s} type="button" onClick={() => onSend(s)} className="h-10 rounded-full border border-[var(--color-border)] bg-white px-4 text-sm hover:border-[var(--color-primary)]">
              {s}
            </button>
          ))}
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClear}
          disabled={isSearching}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={14} /> Clear conversation
        </button>
      </div>

      {/* History is locked while the agent is answering. */}
      <div
        {...inertProps(isSearching)}
        aria-busy={isSearching}
        className={"space-y-5 transition-opacity duration-200 " + (isSearching ? "opacity-70" : "")}
      >
        {messages.map((msg, i) => {
          const d = msg.directive;
          const superseded =
            d && COLLAPSIBLE.has(d.component) && lastIndexByComponent.get(d.component)! > i && !expanded.has(msg.id);
          return (
            <div key={msg.id} id={`msg-${msg.id}`} className="scroll-mt-20">
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--color-primary)] px-4 py-2.5 text-sm text-white">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {msg.content && <AgentBubble>{msg.content}</AgentBubble>}
                  {d &&
                    (superseded ? (
                      <button
                        type="button"
                        onClick={() => toggle(msg.id)}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)]"
                      >
                        {summarize(d)}
                        <span className="flex items-center gap-1 font-medium text-[var(--color-primary)]">
                          Show <ChevronDown size={14} />
                        </span>
                      </button>
                    ) : (
                      <div className="mp-reveal w-full">
                        {renderDirective?.(d, { id: msg.id, isLatest: lastIndexByComponent.get(d.component) === i })}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* The reply currently being written. Results arrive only after it is complete. */}
      {isSearching && (
        <div ref={liveRef} className="space-y-3">
          <AgentBubble live={!!statusText}>{statusText ? statusText : <TypingDots />}</AgentBubble>
          {pendingKinds.length > 0 && <ResultsPlaceholder kinds={pendingKinds} />}
        </div>
      )}
    </div>
  );
}

/** Sticky command bar. Typing stays possible while the agent answers; sending waits until it is done. */
export function AgentComposer({
  onSend,
  isSearching = false,
  placeholder = "Search products or ask the agent…",
}: {
  onSend: (message: string) => void;
  isSearching?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSearching) return;
    onSend(trimmed);
    setDraft("");
  };

  return (
    <form onSubmit={submit} className="sticky bottom-4 z-30 mx-auto mt-8 w-full max-w-3xl">
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-2 pl-4 shadow-[var(--shadow-lg)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
        <Sparkles size={18} className="shrink-0 text-[var(--color-agent)]" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isSearching ? "The agent is responding…" : placeholder}
          aria-label="Ask the shopping agent"
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-[var(--color-muted)]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSearching}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span className="hidden sm:inline">{isSearching ? "Responding" : "Ask"}</span>
        </button>
      </div>
    </form>
  );
}

/** Backwards-compatible all-in-one panel. */
export function AgentChatPanel(props: AgentTranscriptProps & { inputPlaceholder?: string }) {
  return (
    <div>
      <AgentTranscript {...props} />
      <AgentComposer onSend={props.onSend} isSearching={props.isSearching} placeholder={props.inputPlaceholder} />
    </div>
  );
}
