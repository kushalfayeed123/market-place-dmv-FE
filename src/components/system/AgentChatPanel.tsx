"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2 } from "lucide-react";
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
  /** Clear the entire conversation / search results. */
  onClear?: () => void;
}

/**
 * Chat transcript panel.
 *
 * Renders the conversation history (user messages, agent text, and agent
 * ui_directives rendered inline) in a vertically-stacked, non-fixed-height
 * panel. Starts minimal (input only) and grows naturally as messages accrue.
 * The page scrolls normally — no internal scroll containers — so search
 * results rendered inline never cause erratic jumping.
 */
export function AgentChatPanel({
  messages,
  inputPlaceholder = "Ask the agent...",
  onSend,
  isSearching = false,
  statusText,
  renderDirective,
  onClear,
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
        className={`flex gap-1.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            isUser
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-muted)]/20 text-[var(--color-muted)]"
          }`}
        >
          {isUser ? <User size={12} /> : <Bot size={12} />}
        </div>
        <div
          className={` rounded-lg px-2 py-1.5 text-xs ${
            isUser
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-foreground)]"
          }`}
        >
          {msg.content && <div>{msg.content}</div>}
          {msg.directive && renderDirective && (
            <div className="mt-1 w-full max-w-full">
              {renderDirective(msg.directive)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col gap-1">
      {hasMessages ? (
        <div className="flex flex-col gap-1">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClear}
              disabled={isSearching}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Clear conversation and search results"
            >
              <Trash2 size={13} />
              Clear
            </button>
          </div>
          {messages.map(renderMessage)}
          {isSearching && (
            <div className="flex gap-1.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)]/20 text-[var(--color-muted)]">
                <Bot size={12} />
              </div>
              <div className="max-w-[75%] rounded-lg px-2 py-1.5 text-xs bg-[var(--color-surface)] text-[var(--color-foreground)]">
                <div className="text-[var(--color-muted)]">
                  {statusText || "Thinking..."}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      ) : (
        <p className="text-center text-xs text-[var(--color-muted)]"></p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={isSearching}
          className="flex-1 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSearching}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
