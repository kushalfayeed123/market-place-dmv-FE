"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import type { ReactNode } from "react";
import type { UiDirective } from "@/types/components";

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content?: string;
  directive?: UiDirective;
  timestamp: Date;
}

interface AgentChatPanelProps {
  messages: ChatMessage[];
  inputPlaceholder?: string;
  onSend: (message: string) => void;
  isSearching?: boolean;
  statusText?: string | null;
  /** Render an agent ui_directive inline within the chat transcript. */
  renderDirective?: (directive: UiDirective) => ReactNode;
}

/**
 * Persistent chat transcript panel.
 *
 * Renders the full conversation history (user messages, agent text, and
 * agent ui_directives rendered inline) in a scrollable, non-blocking panel.
 * Used as the primary interface on the listing page so the user can search,
 * view products, manage cart/orders, and chat with the agent — all in one
 * unified view that stays at the top of the page.
 */
export function AgentChatPanel({
  messages,
  inputPlaceholder = "Ask the agent...",
  onSend,
  isSearching = false,
  statusText,
  renderDirective,
}: AgentChatPanelProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom smoothly when messages change so the
  // latest response (and any inline results) stays in view.
  // Uses "auto" — not "smooth" — to avoid erratic page jank
  // when large directive results render.
  useEffect(() => {
    bottomRef.current?.scrollIntoView(false);
  }, [messages, isSearching, statusText]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSearching) return;
    onSend(trimmed);
    setDraft("");
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === "user";
    return (
      <div
        key={msg.id}
        className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            isUser
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-muted)]/20 text-[var(--color-muted)]"
          }`}
        >
          {isUser ? <User size={12} /> : <Bot size={12} />}
        </div>
        <div
          className={` rounded-lg px-3 py-2 text-sm ${
            isUser
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-foreground)]"
          }`}
        >
          {msg.content && <div>{msg.content}</div>}
          {msg.directive && renderDirective && (
            <div className="mt-2 w-full max-w-full">
              {renderDirective(msg.directive)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col gap-2.5">
      {hasMessages ? (
        <div className="flex flex-col gap-2.5">
          {messages.map(renderMessage)}
          {isSearching && (
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)]/20 text-[var(--color-muted)]">
                <Bot size={12} />
              </div>
              <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-foreground)]">
                <div className="text-[var(--color-muted)]">
                  {statusText || "Thinking..."}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--color-muted)]">
          Search for products, ask questions, or browse below.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={isSearching}
          className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSearching}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
