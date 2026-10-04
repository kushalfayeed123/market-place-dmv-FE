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
const REFRESH_KEY = "mp_refresh_token";

export const authStore = {
  getAccessToken: () => accessToken,
  setTokens(access: string, refresh: string) {
    accessToken = access;
    if (typeof window !== "undefined") {
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

export const apiClient = {
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
};

