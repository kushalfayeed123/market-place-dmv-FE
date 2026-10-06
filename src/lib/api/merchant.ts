// Thin typed layer for merchant-console endpoints.
// Delegates to apiClient.raw so every request gets:
//  - Bearer access-token injection (with 401 → refresh → retry)
//  - Idempotency-Key on mutating requests
//  - The /api/v1 prefix
import { apiClient, ApiError } from "@/lib/api/client";

export { ApiError };

/**
 * Merchant-console request helper.
 * GET requests that receive a 404 return `null` (spec: "404 → empty")
 * so the UI can render an empty state instead of an error banner.
 */
export async function mreq<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T | null> {
  try {
    return await apiClient.raw<T>(method, path, {
      body,
      idempotent: method !== "GET",
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404 && method === "GET") {
      return null;
    }
    throw e;
  }
}

export interface ProposedAction {
  id: string; label: string; summary: string;
  risk: "low" | "medium" | "high";            // high = money movement / irreversible
  status: "proposed" | "executed" | "dismissed" | "failed";
}
export interface AgentMessage { role: "user" | "agent"; text: string; actions?: ProposedAction[] }

export const agentApi = {
  chat: (merchantId: string, message: string, context: { section: string }) =>
    mreq<{ reply: string; proposed_actions: ProposedAction[] }>(
      "POST", `/agent/merchant/${merchantId}/chat`, { message, context },
    ) as Promise<{ reply: string; proposed_actions: ProposedAction[] }>,
  confirm: (merchantId: string, actionId: string) =>
    mreq<{ ok: boolean; result_summary: string }>(
      "POST", `/agent/merchant/${merchantId}/actions/${actionId}/confirm`,
    ) as Promise<{ ok: boolean; result_summary: string }>,
  dismiss: (merchantId: string, actionId: string) =>
    mreq("POST", `/agent/merchant/${merchantId}/actions/${actionId}/dismiss`)
      .then(() => ({ ok: true, result_summary: "Action dismissed." })),
};

