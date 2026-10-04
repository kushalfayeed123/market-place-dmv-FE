"use client";

import {
  useState,
  useEffect,
  useRef,
  type ComponentProps,
  type FormEvent,
} from "react";
import {
  Store,
  Search,
  Send,
  LogIn,
  LogOut,
  Package,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";

import { ProductGrid } from "./components/catalog/ProductGrid";
import { ProductCard } from "./components/catalog/ProductCard";
import { ProductDetail } from "./components/catalog/ProductDetail";
import { CartSummary } from "./components/cart/CartSummary";
import { OrderList } from "./components/orders/OrderList";
import { OrderConfirmation } from "./components/orders/OrderConfirmation";
import { MerchantBalanceCard } from "./components/merchant/MerchantBalanceCard";
import { LedgerTable } from "./components/merchant/LedgerTable";
import { FulfillmentTracker } from "./components/fulfillment/FulfillmentTracker";
import { ConfirmationDialog } from "./components/system/ConfirmationDialog";
import { SignInPrompt } from "./components/system/SignInPrompt";
import { ErrorMessage } from "./components/system/ErrorMessage";

import type { Product } from "./components/catalog/ProductCard";
import type { Order } from "./components/orders/OrderList";
import type { CartSummaryProps } from "./components/cart/CartSummary";
import type { LedgerEntry } from "./components/merchant/LedgerTable";
import type { UiDirective } from "./types/components";
import type { Product as BackendProduct } from "./lib/api/client";
import { apiClient } from "./lib/api/client";
import { agentGateway } from "./lib/agent-gateway";

// Backend → UI view-model mappers

/**
 * Catalog view-model. The backend `/api/v1/catalog/products` endpoint
 * returns `merchant_id`/`store_id`; the catalog UI shows a human-readable
 * placeholder name until the backend joins the store/merchant name.
 */
type CatalogProduct = Product & {
  description?: string;
  store_name?: string;
  store_id?: string;
};

function toUiProduct(p: BackendProduct): CatalogProduct {
  return {
    id: p.id,
    name: p.title,
    merchant_id: p.merchant_id,
    store_id: p.store_id,
    merchant_name: `Merchant #${p.merchant_id.slice(0, 8)}`,
    store_name: `Store #${p.store_id.slice(0, 8)}`,
    price: { amount: p.base_price_amount, currency: p.base_price_currency },
    status: p.status,
    description: p.description ?? undefined,
    urls: p.urls?.length ? p.urls : undefined,
    image_url: p.urls?.[0] ?? undefined,
  };
}

type ActionHandler = (action: string, data?: unknown) => void;

/**
 * Renders an agent-emitted `ui_directive` into the matching registry
 * component. Props are narrowed defensively — on the directive-rendering
 * path we degrade to <ErrorMessage> rather than crash (per project
 * conventions: no `any` on this path).
 */
function RenderDirective({
  directive,
  onAction,
}: {
  directive: UiDirective;
  onAction?: ActionHandler;
}) {
  const props = directive.props;

  if (directive.component === "ProductGrid") {
    return (
      <ProductGrid
        products={
          Array.isArray(props.products)
            ? (props.products as Product[])
            : []
        }
        query={props.query as string | undefined}
        onView={(p) => onAction?.("view_product", p)}
        onAddToCart={(p) => onAction?.("add_to_cart", p)}
      />
    );
  }
  if (directive.component === "ProductCard") {
    return <ProductCard product={props.product as Product} />;
  }
  if (directive.component === "ProductDetail") {
    return (
      <ProductDetail
        product={props.product as Product & { description?: string }}
        onAddToCart={(p) => onAction?.("add_to_cart", p)}
      />
    );
  }
  if (directive.component === "CartSummary") {
    const cart = props as unknown as CartSummaryProps;
    return (
      <CartSummary {...cart} onCheckout={() => onAction?.("checkout")} />
    );
  }
  if (directive.component === "OrderList") {
    return (
      <OrderList
        orders={
          Array.isArray(props.orders)
            ? (props.orders as Order[])
            : []
        }
        onTrack={(o) => onAction?.("track_order", o)}
      />
    );
  }
  if (directive.component === "OrderConfirmation") {
    return <OrderConfirmation order={props.order as Order} />;
  }
  if (directive.component === "FulfillmentTracker") {
    return (
      <FulfillmentTracker
        order={
          props.order as {
            id: string;
            order_number: string;
            status: string;
            merchant_name: string;
          }
        }
      />
    );
  }
  if (directive.component === "MerchantBalanceCard") {
    const merchant = props as unknown as ComponentProps<
      typeof MerchantBalanceCard
    >;
    return <MerchantBalanceCard {...merchant} />;
  }
  if (directive.component === "LedgerTable") {
    return (
      <LedgerTable
        entries={
          Array.isArray(props.entries)
            ? (props.entries as LedgerEntry[])
            : []
        }
      />
    );
  }
  if (directive.component === "ConfirmationDialog") {
    const cprops = props as ComponentProps<typeof ConfirmationDialog> & {
      confirmed_token?: string;
    };
    return (
      <ConfirmationDialog
        title={cprops.title}
        message={cprops.message}
        tool_name={cprops.tool_name}
        onConfirm={() =>
          onAction?.("confirm", cprops.confirmed_token ?? cprops.tool_name)
        }
        onCancel={() => onAction?.("cancel")}
      />
    );
  }
  if (directive.component === "SignInPrompt") {
    const auth = props as unknown as ComponentProps<typeof SignInPrompt>;
    return <SignInPrompt {...auth} />;
  }
  if (directive.component === "ErrorMessage") {
    const err = props as unknown as ComponentProps<typeof ErrorMessage>;
    return <ErrorMessage {...err} />;
  }
  return (
    <ErrorMessage message={`Unknown component: ${directive.component}`} />
  );
}

// ────────────────────────────────────────────────────────────
// Product listing page (the app entry point at "/")
// ────────────────────────────────────────────────────────────
//
// There is no "agent / classic" mode toggle on this page — product
// browsing is always available via the REST catalog, and searching is
// always delegated to the agent (POST /sse). The full grid is shown so
// users can browse a lot of products at once; agent search results are
// rendered in their own section above the browse grid.

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  // Browse — display a lot of products at once (REST catalog).
  const [browseProducts, setBrowseProducts] = useState<CatalogProduct[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError] = useState<string | null>(null);

  // Agent search — results + inline context (cart, orders, confirmations…).
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [contextDirective, setContextDirective] = useState<UiDirective | null>(
    null,
  );
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [statusText, setStatusText] = useState<string | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load the full catalog for browsing ──
  const loadProducts = () => {
    setBrowseLoading(true);
    setBrowseError(null);
    apiClient
      .getProducts()
      .then((data) => {
        setBrowseProducts(data.map(toUiProduct));
        setBrowseError(null);
      })
      .catch(() => setBrowseError("Could not load products."))
      .finally(() => setBrowseLoading(false));
  };

  // Load the full catalog for browsing (once on mount).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadProducts();
  }, []);

  // ── Connect to the Agent Gateway (SSE) on mount ──
  useEffect(() => {
    const stored = agentGateway.getStoredSessionId();
    agentGateway.connect(stored ?? undefined);

    agentGateway.setHandlers({
      onSession: () => setAgentConnected(true),
      onText: (content) => setStatusText(content || null),
      onDirective: (directive) => {
        if (
          directive.component === "ProductGrid" ||
          directive.component === "ProductCard"
        ) {
          setSearchResults((prev) => {
            const existing = prev ?? [];
            if (directive.component === "ProductCard") {
              return [...existing, directive.props.product as Product];
            }
            return Array.isArray(directive.props.products)
              ? (directive.props.products as Product[])
              : existing;
          });
          setSearching(false);
        } else if (directive.component === "ProductDetail") {
          setSelectedProduct(directive.props.product as CatalogProduct);
          setContextDirective(null);
          setSearching(false);
        } else {
          // CartSummary, OrderList, OrderConfirmation, MerchantBalanceCard,
          // LedgerTable, FulfillmentTracker, ConfirmationDialog, SignInPrompt,
          // ErrorMessage — render inline in the context rail.
          setContextDirective(directive);
          setSearching(false);
        }
      },
      onError: (error) => {
        setSearching(false);
        setStatusText(error);
      },
    });

    return () => agentGateway.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search actions ──
  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchTerm(q);
    setSearchResults(null);
    setContextDirective(null);
    setSelectedProduct(null);
    setStatusText(null);
    setSearching(true);
    inputRef.current?.focus();
    agentGateway.sendMessage(q);
  }

  function handleViewProduct(p: Product) {
    setSelectedProduct(p as CatalogProduct);
    setContextDirective(null);
  }

  function handleAddToCart(p: Product) {
    agentGateway.sendMessage(`Add ${p.name} to my cart`);
  }

  function handleAction(action: string, data?: unknown) {
    if (action === "view_product") {
      setSelectedProduct(data as CatalogProduct);
    } else if (action === "add_to_cart") {
      agentGateway.sendMessage(`Add ${(data as Product).name} to my cart`);
    } else if (action === "checkout") {
      agentGateway.sendMessage("checkout please");
    } else if (action === "track_order") {
      setContextDirective(null);
    } else if (action === "confirm") {
      agentGateway.sendMessage(
        "Confirmed",
        data as string | undefined,
      );
    } else if (action === "cancel") {
      setContextDirective(null);
      setStatusText(null);
    }
  }

  const showResults = searchResults && searchResults.length > 0;
  const showEmptyResults =
    searchResults && searchResults.length === 0 && !searching;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-foreground)]">
      {/* ── Header: brand + search ── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <span className="font-[var(--font-display)] text-xl font-semibold">
              Markto
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-agent)]/20 text-[var(--color-agent)] font-semibold uppercase tracking-wide">
                AI
              </span>
            </span>
          </div>
          <a
            href="/landing"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            Marketing site
          </a>

          <nav className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <span
                className={
                  "w-2 h-2 rounded-full " +
                  (agentConnected ? "bg-green-400" : "bg-red-400")
                }
              />
              <span className="hidden sm:inline">
                Agent {agentConnected ? "online" : "offline"}
              </span>
            </span>
            {isAuthenticated ? (
              <button
                onClick={() => logout().catch(() => {})}
                className="flex items-center gap-1.5 text-xs text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
              >
                <LogOut size={14} />{" "}
                <span>{user?.first_name ?? "Account"}</span>
              </button>
            ) : (
              <a
                href="/auth"
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                <LogIn size={14} /> Sign in
              </a>
            )}
          </nav>
        </div>

        {/* Agent-powered search bar */}
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, merchants, orders… (agent-powered)"
              className="w-full pl-11 pr-12 py-2.5 border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] disabled:opacity-60"
              disabled={searching}
            />
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim() || searching}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {searching ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </form>
          {statusText && (
            <p
              className={
                "mt-1 text-xs " +
                (searching
                  ? "text-[var(--color-muted)]"
                  : "text-[var(--color-danger-fg)]")
              }
            >
              {statusText}
            </p>
          )}
        </div>
      </header>
                  <main className="max-w-7xl mx-auto px-5 sm:px-8 py-6">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <div className="grid grid-cols-1  gap-6 items-start">
            <div className="xl:col-span-2 space-y-8">
              {/* Search results (rendered from agent ui_directives) */}
              {showResults && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Search results for “{searchTerm}”
                  </h2>
                  <ProductGrid
                    products={searchResults}
                    query={searchTerm ?? undefined}
                    onView={handleViewProduct}
                    onAddToCart={handleAddToCart}
                  />
                </section>
              )}
              {showEmptyResults && (
                <section className="text-sm text-[var(--color-muted)]">
                  No products found for “{searchTerm}”. Try a different
                  search.
                </section>
              )}

              {/* Browse all products (lots of products at once) */}
              <section>
                <h2 className="text-lg font-semibold mb-3">
                  All products
                </h2>
                {browseLoading ? (
                  <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-[4/3] bg-gray-100 rounded-xl animate-pulse mb-3 break-inside-avoid"
                      />
                    ))}
                  </div>
                ) : browseError ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <Package size={16} />
                    <span>{browseError}</span>
                    <button
                      onClick={loadProducts}
                      className="underline text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <ProductGrid
                    products={browseProducts}
                    onView={handleViewProduct}
                    onAddToCart={handleAddToCart}
                  />
                )}
              </section>
            </div>

            {/* Context rail: cart / orders / confirmations from the agent */}
            <div className="space-y-4">
              {contextDirective && (
                <RenderDirective
                  directive={contextDirective}
                  onAction={handleAction}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-5 sm:px-8 py-6 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-muted)]">
        <span>© {new Date().getFullYear()} Markto. </span>
        <a
          href="/landing"
          className="underline hover:text-[var(--color-foreground)]"
        >
          Marketing site
        </a>
      </footer>
    </div>
  );
}



