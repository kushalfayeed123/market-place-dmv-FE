// Thin typed layer for merchant-console endpoints. Many do not exist yet — the
// backend agent should implement them as specified in HANDOFF.md.
// If apiClient exposes a shared request helper, swap `mreq` for it (keep signatures).
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function mreq<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE + path, {
    method, credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail ?? r.statusText);
  return r.status === 204 ? (undefined as T) : r.json();
}

export interface ProposedAction {
  id: string; label: string; summary: string;
  risk: "low" | "medium" | "high";            // high = money movement / irreversible
  status: "proposed" | "executed" | "dismissed" | "failed";
}
export interface AgentMessage { role: "user" | "agent"; text: string; actions?: ProposedAction[] }

export const agentApi = {
  chat: (merchantId: string, message: string, context: { section: string }) =>
    mreq<{ reply: string; proposed_actions: ProposedAction[] }>("POST", `/agent/merchant/${merchantId}/chat`, { message, context }),
  confirm: (merchantId: string, actionId: string) =>
    mreq<{ ok: boolean; result_summary: string }>("POST", `/agent/merchant/${merchantId}/actions/${actionId}/confirm`),
  dismiss: (merchantId: string, actionId: string) =>
    mreq("POST", `/agent/merchant/${merchantId}/actions/${actionId}/dismiss`),
};
