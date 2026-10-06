import type { UiDirective } from "@/types/components";

/**
 * Agent Gateway client.
 *
 * The Gateway (FastAPI - Agent/gateway/main.py) exposes a single streaming
 * endpoint: POST /sse with body { message, session_id?, confirmed_token?,
 * user_token? }. It responds text/event-stream with that turn's events, then
 * closes:
 *   event: session      -> { session_id }
 *   event: text         -> { content }
 *   event: ui_directive -> { directive }   (UIDirective envelope)
 *   event: error        -> { error }
 *
 * There is no persistent listen stream - each POST streams one turn. Sessions
 * are resumed by passing the stored session_id on the next POST. (Native
 * EventSource cannot POST, so the SSE wire format is parsed manually.)
 *
 * Authenticated requests: the frontend always forwards the signed-in user's
 * Bearer access token as `user_token` so action intents (add_to_cart,
 * checkout, confirm, ...) are authenticated, even for sessions that started
 * anonymously before the user signed in.
 */
type GatewayHandlers = {
  onSession?: (sessionId: string) => void;
  onText?: (content: string) => void;
  onDirective?: (directive: UiDirective) => void;
  onError?: (error: string) => void;
  /** Called when a turn's event stream finishes (success, error, or network end). */
  onEnd?: () => void;
};

const SESSION_KEY = "mp_agent_session_id";

export class AgentGatewayClient {
  private handlers: GatewayHandlers = {};
  private sessionId: string | null = null;
  private baseUrl: string;
  private ready = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  setHandlers(h: GatewayHandlers) {
    this.handlers = h;
  }

  isConnected() {
    return this.ready;
  }

  getStoredSessionId(): string | null {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(SESSION_KEY);
  }

  /** Resume a stored session (or mark ready for a fresh one). */
  connect(sessionId?: string | null) {
    this.sessionId = sessionId ?? this.getStoredSessionId();
    this.ready = true;
  }

  disconnect() {
    this.ready = false;
  }

  private storeSessionId(id: string) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
  }

  /**
   * Resolve the signed-in user's Bearer access token to forward as `user_token`
   * on every SSE POST, so action intents (add_to_cart, checkout, confirm) are
   * authenticated for a signed-in user who started the session anonymously.
   */
  private getAuthToken(): string | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { authStore } = require("@/lib/api/client");
      const token = authStore.getAccessToken();
      return token ? `Bearer ${token}` : null;
    } catch {
      return null;
    }
  }

  /** Send a user message; resolves when the turn's event stream completes. */
  async sendMessage(
    message: string,
    confirmedToken?: string,
  ): Promise<void> {
    if (!this.ready) {
      this.handlers.onError?.("Gateway not connected");
      return;
    }
    try {
      const res = await fetch(this.baseUrl + "/sse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          session_id: this.sessionId ?? undefined,
          confirmed_token: confirmedToken ?? undefined,
          user_token: this.getAuthToken() ?? undefined,
        }),
      });
      if (!res.ok || !res.body) {
        this.handlers.onError?.("Gateway unreachable (" + res.status + ")");
        this.handlers.onEnd?.();
        return;
      }
      await this.consumeStream(res);
    } catch {
      this.handlers.onError?.("Failed to reach agent gateway");
      this.handlers.onEnd?.();
    }
  }

  private async consumeStream(res: Response): Promise<void> {
    try {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) this.handleChunk(chunk);
      }
    } finally {
      // The gateway closes the stream at the end of the turn — notify handlers
      // so UI state (searching spinner, etc.) is reset even on a clean finish.
      this.handlers.onEnd?.();
    }
  }

  private handleChunk(chunk: string) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of chunk.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(dataLines.join("\n"));
    } catch {
      return;
    }
    if (event === "session") {
      const id = String(payload.session_id ?? "");
      if (id) {
        this.sessionId = id;
        this.storeSessionId(id);
        this.handlers.onSession?.(id);
      }
    } else if (event === "text") {
      this.handlers.onText?.(String(payload.content ?? ""));
    } else if (event === "ui_directive") {
      const directive = (payload.directive ?? payload) as UiDirective;
      this.handlers.onDirective?.(directive);
    } else if (event === "error") {
      this.handlers.onError?.(String(payload.error ?? "Unknown gateway error"));
    }
  }
}

export const agentGateway = new AgentGatewayClient(
  process.env.NEXT_PUBLIC_AGENT_GATEWAY_URL ?? "http://localhost:8001",
);
