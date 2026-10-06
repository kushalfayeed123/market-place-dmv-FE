import { env } from "@/env";

/**
 * Typed API client for the Classic (non-agent) fallback view.
 * Talks directly to the FastAPI backend (/api/v1). Handles:
 *  - Bearer access-token injection
 *  - Transparent refresh-token rotation on 401
 *  - Idempotency-Key injection on mutating financial requests
 *  - Rate-limit (429) backoff with Retry-After
 */

const API_BASE = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

// ── Auth token store (in-memory access token + sessionStorage refresh) ──
let accessToken: string | null = null;
const ACCESS_TOKEN_KEY = "mp_access_token";
const REFRESH_KEY = "mp_refresh_token";

// Hydrate the in-memory access-token cache from sessionStorage so the
// token survives a full page reload.  On the server (SSR) window is
// undefined, so the cache stays null — the token is only read on the
// client where a prior login stored it.
if (typeof window !== "undefined") {
  accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export const authStore = {
  getAccessToken: () => accessToken,
  setTokens(access: string, refresh: string) {
    accessToken = access;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
      window.sessionStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  getRefreshToken: () =>
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(REFRESH_KEY)
      : null,
    clear() {
    accessToken = null;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      window.sessionStorage.removeItem(REFRESH_KEY);
    }
  },
};

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refresh = authStore.getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}${API_PREFIX}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    authStore.setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function raw<T>(
  method: string,
  path: string,
  opts: {
    body?: unknown;
    form?: URLSearchParams;
    idempotent?: boolean;
    retry?: number;
  } = {},
): Promise<T> {
  const { body, form, idempotent, retry = 0 } = opts;
  const headers: Record<string, string> = {};
  const token = authStore.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotent) headers["Idempotency-Key"] = newIdempotencyKey();

  let payload: BodyInit | undefined;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    method,
    headers,
    body: payload,
  });

  // 401 → try refresh once, then replay the request
  if (res.status === 401 && retry === 0) {
    if (!refreshInFlight) refreshInFlight = refreshTokens();
    const ok = await refreshInFlight;
    refreshInFlight = null;
    if (ok) return raw<T>(method, path, { ...opts, retry: 1 });
    authStore.clear();
  }

  // 429 → honor Retry-After once, then replay
  if (res.status === 429 && retry === 0) {
    const ra = Number(res.headers.get("Retry-After") ?? "1");
    await new Promise((r) => setTimeout(r, Math.min(ra, 10) * 1000));
    return raw<T>(method, path, { ...opts, retry: 1 });
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = (await res.json()) as { detail?: string };
      if (errBody?.detail) detail = errBody.detail;
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}


// ── Public typed API surface (mirrors backend /api/v1 routes) ──

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: Record<string, unknown>;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  merchant_id: string;
  store_id: string;
  category_id: string | null;
  fulfillment_type: string;
  status: string;
  base_price_amount: number;
  base_price_currency: string;
  attributes: Record<string, unknown>;
  variants: unknown[];
  urls?: string[];
}

export interface Order {
  id: string;
  buyer_id: string;
  status: string;
  currency: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: Array<Record<string, unknown>>;
}

// ── Merchant types (mirrors Backend /api/v1/merchants and /ledger schemas) ──

export interface MerchantResponse {
  id: string;
  owner_user_id: string;
  business_name: string;
  slug: string;
  kyc_status: string;
  kyc_provider_ref?: string | null;
  commission_plan_id: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload for POST /merchants/onboard — self-service merchant setup. */
export interface MerchantOnboard {
  business_name: string;
  slug: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export interface LedgerBalance {
  merchant_id: string;
  currency: string;
  total_balance: number; // minor units (cents / kobo)
  available_balance: number;
  held_balance: number;
  calculated_at: string;
}

export interface LedgerEntryResponse {
  id: string;
  entry_group_id: string;
  account_type: string;
  merchant_id?: string | null;
  direction: string;
  entry_type: string;
  amount: number; // minor units
  currency: string;
  order_id?: string | null;
  payment_transaction_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string;
}

export const apiClient = {
  raw,
  async login(email: string, password: string) {
    const form = new URLSearchParams({ username: email, password });
    const data = await raw<TokenResponse>("POST", "/auth/login", { form });
    authStore.setTokens(data.access_token, data.refresh_token);
    return data;
  },
  register(payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    return raw<TokenResponse>("POST", "/auth/register", {
      body: payload,
      idempotent: true,
    }).then((data) => {
      authStore.setTokens(data.access_token, data.refresh_token);
      return data;
    });
  },
  logout() {
    return raw<Record<string, unknown>>("POST", "/auth/logout", {
      body: {},
    }).finally(() => authStore.clear());
  },
  getMe() {
    return raw<Record<string, unknown>>("GET", "/auth/me");
  },
  getProducts() {
    return raw<Product[]>("GET", "/catalog/products");
  },
  getProduct(id: string) {
    return raw<Product>("GET", `/catalog/products/${id}`);
  },
  getCategories() {
    return raw<Array<Record<string, unknown>>>("GET", "/catalog/categories");
  },
  getOrders() {
    return raw<Order[]>("GET", "/orders/");
  },
  checkout(items: Array<{ variant_id: string; quantity: number }>) {
    return raw<Record<string, unknown>>("POST", "/orders/checkout", {
      body: { items },
      idempotent: true,
    });
  },
    processPayment(orderId: string, provider = "paystack") {
    return raw<Record<string, unknown>>("POST", "/payments/process", {
      body: { order_id: orderId, provider },
      idempotent: true,
    });
  },

  // ── Merchant dashboard endpoints ──

    /// GET /merchants/by-owner/{user_id} — fetch the merchant record for the
  /// authenticated user, or 404 if the user has no store yet.
  getMyMerchant(userId: string) {
    return raw<MerchantResponse>("GET", `/merchants/by-owner/${userId}`);
  },

    /// POST /merchants/onboard — create a merchant (and primary store) for
  /// the currently authenticated merchant_owner.  Owner ID and default
  /// commission plan are derived server-side.
  onboardMerchant(payload: MerchantOnboard) {
    return raw<MerchantResponse>("POST", "/merchants/onboard", {
      body: payload,
      idempotent: true,
    });
  },

  /// GET /ledger/balance/{merchant_id} — current balance snapshot.
  getMerchantBalance(merchantId: string) {
    return raw<LedgerBalance>("GET", `/ledger/balance/${merchantId}`);
  },

  /// GET /ledger/entries?merchant_id=... — ledger line items for a merchant.
  getLedgerEntries(
    merchantId: string,
    opts: { skip?: number; limit?: number } = {},
  ) {
    const q = new URLSearchParams();
    q.set("merchant_id", merchantId);
    if (opts.skip !== undefined) q.set("skip", String(opts.skip));
    if (opts.limit !== undefined) q.set("limit", String(opts.limit));
    return raw<LedgerEntryResponse[]>("GET", `/ledger/entries?${q.toString()}`);
  },
};

