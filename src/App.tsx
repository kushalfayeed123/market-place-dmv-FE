"use client";

import {
  useState,
  useEffect,
  useRef,
  type ComponentProps,
} from "react";
import {
    BookOpen,
    Store,
  LogIn,
  LogOut,
  Package,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";

import { ProductGrid, ProductGridSkeleton } from "./components/catalog/ProductGrid";
import {
  CATALOG_PRODUCT_SECTIONS,
  groupCatalogProducts,
  toUiProduct,
  type CatalogProduct,
} from "./components/catalog/catalogProductUtils";
import { ProductCard } from "./components/catalog/ProductCard";
import { ProductDetail } from "./components/catalog/ProductDetail";
import { KBResultList, type KBSearchResult } from "./components/catalog/KBResultCard";
import { CartSummary } from "./components/cart/CartSummary";
import { OrderList } from "./components/orders/OrderList";
import { DigitalLibrary } from "./components/orders/DigitalLibrary";
import { DeliveryAddressForm, type DeliveryAddress } from "./components/orders/DeliveryAddressForm";
import { OrderConfirmation } from "./components/orders/OrderConfirmation";
import { PaymentCapturePanel } from "./components/orders/PaymentCapturePanel";
import type { PaymentCapturePanelProps } from "./components/orders/PaymentCapturePanel";
import { PaymentSelection } from "./components/orders/PaymentSelection";
import { OrderSuccess } from "./components/orders/OrderSuccess";
import { MerchantBalanceCard } from "./components/merchant/MerchantBalanceCard";
import { LedgerTable } from "./components/merchant/LedgerTable";
import { FulfillmentTracker } from "./components/fulfillment/FulfillmentTracker";
import { ConfirmationDialog } from "./components/system/ConfirmationDialog";
import { SignInPrompt } from "./components/system/SignInPrompt";
import { ErrorMessage } from "./components/system/ErrorMessage";
import { AgentTranscript, AgentComposer } from "./components/system/AgentChatPanel";

import type { Product } from "./components/catalog/ProductCard";
import type {
  CartState,
  ProductGridDirectiveProps,
  ProductDetailDirectiveProps,
  PaymentSelectionDirectiveProps,
  OrderSuccessDirectiveProps,
} from "./components/catalog/directives";
import type { Order } from "./components/orders/OrderList";
import type { CartSummaryProps, CartChange } from "./components/cart/CartSummary";
import type { LedgerEntry } from "./components/merchant/LedgerTable";
import type { UiDirective, CanvasMessage } from "./types/components";
import { apiClient } from "./lib/api/client";
import type { Product as ApiProduct, PaymentTransactionResponse } from "./lib/api/client";
import { resolveCheckoutFulfillment, type CheckoutFulfillment } from "./lib/checkoutFlow";
import { agentGateway } from "./lib/agent-gateway";
import { cleanAgentText, dedupeDirectives } from "./lib/agent-turn";

// Backend -> UI view-model mappers

/**
 * The agent emits props.items for BOTH semantic_search (raw knowledge-base
 * documents with text + metadata) and search_products (real product DTOs
 * with name + price). Split them so KB hits render as snippet cards and
 * product DTOs render as ProductCards - never the two mixed in one grid.
 */
function partitionResults(
  items: Array<Record<string, unknown>>,
): { products: Product[]; docs: KBSearchResult[] } {
  const products: Product[] = [];
  const docs: KBSearchResult[] = [];
  for (const it of items) {
    if (!it) continue;
    if (typeof it.text === "string" && typeof it.name !== "string") {
      docs.push(it as unknown as KBSearchResult);
    } else if (typeof it.name === "string") {
      products.push(it as unknown as Product);
    }
  }
  return { products, docs };
}

type ActionHandler = (action: string, data?: unknown) => void | Promise<void>;

function asProducts(v: unknown): Product[] {
  return Array.isArray(v)
    ? partitionResults(v as Array<Record<string, unknown>>).products
    : [];
}

/**
 * Renders an agent-emitted ui_directive into the matching registry
 * component. Props are narrowed defensively - on the directive-rendering
 * path we degrade to <ErrorMessage> rather than crash (no any here).
 *
 * Agent actions: view_product, add_to_cart ({ product, quantity }),
 * suggest (free-text follow-up), back, checkout, confirm, cancel.
 */
function RenderDirective({
  directive,
  onAction,
  cartState,
  readOnly,
}: {
  directive: UiDirective;
  onAction?: ActionHandler;
  cartState?: CartState;
  readOnly?: boolean;
}) {
  const props = directive.props;
  const addToCart = (p: Product, quantity = 1) =>
    onAction?.("add_to_cart", { product: p, quantity });
  const suggest = (text: string) => onAction?.("suggest", text);

  if (directive.component === "ProductGrid") {
    const gp = props as ProductGridDirectiveProps;
    const raw = Array.isArray(gp.items) ? gp.items : Array.isArray(gp.products) ? gp.products : [];
    const { products, docs } = partitionResults(raw as Array<Record<string, unknown>>);
    if (!products.length && !docs.length) {
      return <ProductGrid products={[]} query={gp.query} suggestions={gp.suggestions} onSuggest={suggest} />;
    }
    return (
      <div className="space-y-6">
        {products.length > 0 && (
          <ProductGrid
            products={products}
            query={gp.query}
            summary={gp.summary}
            sort={gp.sort}
            category={gp.category}
            suggestions={gp.suggestions}
            highlights={gp.highlights}
            cartState={cartState}
            onView={(p) => onAction?.("view_product", p)}
            onAddToCart={(p) => addToCart(p)}
            onSuggest={suggest}
          />
        )}
        {docs.length > 0 && (
          <KBResultList docs={docs} onViewProduct={(id) => onAction?.("view_product", id)} />
        )}
      </div>
    );
  }
  if (directive.component === "ProductCard") {
    const product = props.product as Product;
    return (
      <div className="max-w-[240px]">
        <ProductCard
          product={product}
          cartState={cartState?.[product.id]}
          onView={(p) => onAction?.("view_product", p)}
          onAddToCart={(p) => addToCart(p)}
        />
      </div>
    );
  }
  if (directive.component === "ProductDetail") {
    const dp = props as unknown as ProductDetailDirectiveProps;
    return (
      <ProductDetail
        product={dp}
        related={asProducts(dp.related)}
        cartState={cartState?.[dp.id]}
        onBack={() => onAction?.("back")}
        onAddToCart={(p, qty) => addToCart(p, qty)}
        onView={(p) => onAction?.("view_product", p)}
        onSuggest={suggest}
      />
    );
  }
  if (directive.component === "CategoryList") {
    const items = Array.isArray(props.items)
      ? (props.items as Array<{
          id: string;
          name: string;
          slug?: string;
          product_count?: number | null;
        }>)
      : [];
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((cat) => (
          <button
            key={cat.id ?? cat.slug ?? cat.name}
            type="button"
            onClick={() => onAction?.("suggest", `Show me ${cat.name} products`)}
            className="flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-left transition-colors hover:border-[var(--color-primary)]"
          >
            <span className="text-sm font-medium">{cat.name}</span>
            {cat.product_count != null && (
              <span className="text-xs text-[var(--color-muted)]">
                {cat.product_count} item{cat.product_count === 1 ? "" : "s"}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }
  if (directive.component === "CartSummary") {
    const cart = props as unknown as CartSummaryProps;
    return (
      <CartSummary
        {...cart}
        readOnly={readOnly}
        onCheckout={() => onAction?.("checkout")}
        onUpdateItems={(changes) => onAction?.("update_cart", changes)}
      />
    );
  }
  if (directive.component === "OrderList") {
    return (
      <OrderList
        orders={
          Array.isArray(props.orders)
            ? props.orders
            : []
        }
        onTrack={(o) => onAction?.("track_order", o)}
            />
    );
  }
  if (directive.component === "OrderConfirmation") {
    return <OrderConfirmation order={props.order as Order} />;
  }
  if (directive.component === "PaymentCapturePanel") {
    const p = props as Record<string, unknown>;
    return (
      <PaymentCapturePanel
        order_id={String(p.order_id ?? p.id ?? "")}
        order_number={String(p.order_number ?? "")}
        status={String(p.status ?? "pending")}
        total={
          typeof p.total_amount === "number"
            ? { amount: p.total_amount, currency: String(p.currency ?? "NGN") }
            : typeof p.amount === "number"
              ? { amount: p.amount, currency: String(p.currency ?? "NGN") }
              : undefined
        }
        item_count={p.item_count as number | undefined}
        payment_required={p.payment_required as boolean | undefined}
        message={p.message as string | undefined}
        payment={
          "id" in p
            ? ({
                id: p.id,
                status: p.status,
                amount: p.amount,
                provider: p.provider,
                provider_reference: p.provider_reference,
                payment_method: p.payment_method ?? (p.provider === "pay_on_delivery" ? "pay_on_delivery" : undefined),
                payment_url: p.payment_url as string | undefined,
                created_at: p.created_at,
                updated_at: p.updated_at,
              } as PaymentCapturePanelProps["payment"])
            : undefined
        }
        onPay={() => onAction?.("process_payment", { order_id: String(p.order_id ?? p.id ?? "") })}
        onPayOnDelivery={() => onAction?.("process_payment", { order_id: String(p.order_id ?? p.id ?? ""), provider: "pay_on_delivery" })}
      />
    );
  }
  if (directive.component === "PaymentSelection") {
    const p = props as unknown as PaymentSelectionDirectiveProps & {
      onSelect?: (m: string) => void;
      order_id?: string;
    };
    // Pay CTAs only render when the directive carries the order to pay for;
    // they reuse the same process_payment action as PaymentCapturePanel.
    const orderId = typeof p.order_id === "string" ? p.order_id : undefined;
    return (
      <PaymentSelection
        methods={Array.isArray(p.methods) ? p.methods : []}
        selected={p.selected ?? null}
        onSelect={(m: string) => {
          onAction?.("select_payment_method", m);
          p.onSelect?.(m);
        }}
        onPayNow={
          orderId
            ? () => onAction?.("process_payment", { order_id: orderId })
            : undefined
        }
        onPayOnDelivery={
          orderId
            ? () => onAction?.("process_payment", { order_id: orderId, provider: "pay_on_delivery" })
            : undefined
        }
      />
    );
  }
  if (directive.component === "DeliveryAddressForm") {
    return (
      <DeliveryAddressForm
        onSubmit={(address) =>
          Promise.resolve(onAction?.("submit_delivery_address", address))
        }
      />
    );
  }
  if (directive.component === "OrderSuccess") {
    const p = props as unknown as OrderSuccessDirectiveProps & { onClose?: () => void };
    return (
      <OrderSuccess
        order={p.order as any}
        onClose={() => {
          onAction?.("close_order_success");
          p.onClose?.();
        }}
        showTracker={p.showTracker ?? true}
      />
    );
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
        onConfirm={() => {
          const token = cprops.confirmed_token ?? crypto.randomUUID();
          onAction?.("confirm", token);
        }}
        onCancel={() => onAction?.("cancel")}
            />
    );
    }
  if (directive.component === "SignInPrompt") {
      const auth = props as ComponentProps<typeof SignInPrompt> & {
        resume_message?: string;
      };
      return (
        <SignInPrompt
          message={auth.message}
          onSignIn={() => {
            onAction?.("sign_in", auth.resume_message);
          }}
        />
      );
  }
  if (directive.component === "ErrorMessage") {
    const err = props as unknown as ComponentProps<typeof ErrorMessage>;
    return <ErrorMessage {...err} />;
  }
  return (
    <ErrorMessage message={`Unknown component: ${directive.component}`} />
  );
}

// ////////////////////////////////////////////////
// Product listing page (the app entry point at "/")
// ////////////////////////////////////////////////
//
// There is no "agent / classic" mode toggle on this page - product
// browsing is always available via the REST catalog, and searching is
// always delegated to the agent (POST /sse). The full grid is shown so
// users can browse a lot of products at once; agent search results are
// rendered in their own section above the browse grid.

const STARTER_PROMPTS = [
  "Show me what's popular",
  "Find something under ₦50,000",
  "What categories do you have?",
];

export default function App() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  // Browse - display a lot of products at once (REST catalog).
  const [browseProducts, setBrowseProducts] = useState<CatalogProduct[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError] = useState<string | null>(null);

  // Agent interaction state
  const [searching, setSearching] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);
  // Add-to-cart feedback per product id, and the latest known cart size.
  const [cartState, setCartState] = useState<CartState>({});
  const [cartCount, setCartCount] = useState<number | null>(null);

  // -- Direct checkout / payment flow (works without the agent) --
  const [checkoutPending, setCheckoutPending] = useState<{
    order_id: string;
    order_number: string;
    status: string;
    total_amount: number;
    currency: string;
    fulfillment: CheckoutFulfillment;
    payment?: PaymentTransactionResponse;
  } | null>(null);
  const [checkoutPanelOpen, setCheckoutPanelOpen] = useState(false);
  const [checkoutRestored, setCheckoutRestored] = useState(false);
  const [checkoutOrderStatus, setCheckoutOrderStatus] = useState<string | null>(null);
  const [checkoutStatusError, setCheckoutStatusError] = useState<string | null>(null);
  const [paymentPaying, setPaymentPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const pendingCheckout = useRef<{
    items: Array<{ variant_id: string; quantity: number }>;
    fulfillment: CheckoutFulfillment;
    idempotencyKey: string;
  } | null>(null);
  const paymentIdempotencyKey = useRef<{ orderId: string; key: string } | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [digitalLibraryOpen, setDigitalLibraryOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("mp_pending_checkout");
      if (!saved) return;
      const restored = JSON.parse(saved) as {
        checkoutPending?: typeof checkoutPending;
        checkoutOrderStatus?: string | null;
      };
      if (
        restored.checkoutPending &&
        typeof restored.checkoutPending.order_id === "string" &&
        typeof restored.checkoutPending.order_number === "string"
      ) {
        setCheckoutPending(restored.checkoutPending);
        setCheckoutOrderStatus(restored.checkoutOrderStatus ?? null);
        setCheckoutPanelOpen(true);
      }
    } catch (error) {
      console.error("Could not restore pending checkout.", error);
      window.sessionStorage.removeItem("mp_pending_checkout");
    } finally {
      setCheckoutRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!checkoutRestored) return;
    if (checkoutPending) {
      window.sessionStorage.setItem(
        "mp_pending_checkout",
        JSON.stringify({ checkoutPending, checkoutOrderStatus }),
      );
    } else {
      window.sessionStorage.removeItem("mp_pending_checkout");
    }
  }, [checkoutPending, checkoutOrderStatus, checkoutRestored]);

  // -- Persistent agent chat transcript
  // Keeps every user message + agent reply (text and directives) so the
  // conversation stays visible while products are browsed.
  const [chatMessages, setChatMessages] = useState<CanvasMessage[]>([]);
  const chatIdRef = useRef(0);
  const [transcriptLoaded, setTranscriptLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("mp_agent_transcript");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const restored = parsed
            .filter(
              (message): message is CanvasMessage =>
                !!message &&
                typeof message === "object" &&
                typeof message.id === "string" &&
                (message.role === "user" || message.role === "agent"),
            )
            .map((message) => ({
              ...message,
              timestamp: new Date(message.timestamp),
            }));
          setChatMessages(restored);
          chatIdRef.current = restored.reduce(
            (max, message) => Math.max(max, Number(message.id) || 0),
            0,
          );
        }
      }
    } catch (error) {
      console.error("Could not restore the agent conversation.", error);
      window.sessionStorage.removeItem("mp_agent_transcript");
    } finally {
      setTranscriptLoaded(true);
    }
  }, []);
  useEffect(() => {
    if (!transcriptLoaded) return;
    try {
      window.sessionStorage.setItem(
        "mp_agent_transcript",
        JSON.stringify(chatMessages),
      );
    } catch (error) {
      console.error("Could not save the agent conversation.", error);
    }
  }, [chatMessages, transcriptLoaded]);
  // Ref mirror of chatMessages so that async callbacks (e.g. finishTurn
  // inside the SSE handler) always see the latest transcript even though
  // the handler closure is created once on mount.
  const chatMessagesRef = useRef<CanvasMessage[]>([]);
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);
  // Monotonic id for transcript entries (persists across turns within a session).
  function pushChat(msg: Partial<CanvasMessage>) {
    const id = String(++chatIdRef.current);
    setChatMessages((prev) => [...prev, {
      id, role: "agent", timestamp: new Date(), ...msg,
    } as CanvasMessage]);
  }
  function addUserMessage(content: string) {
    const id = String(++chatIdRef.current);
    setChatMessages((prev) =>
      [...prev, { id, role: "user", content, timestamp: new Date() }],
    );
  }

  const textBufferRef = useRef<string>("");

  const loadProducts = () => {
    setBrowseLoading(true);
    setBrowseError(null);
    apiClient
      .getProducts(20)
      .then((data) => {
        setBrowseProducts(data.map(toUiProduct));
        setBrowseError(null);
      })
      .catch(() => setBrowseError("Could not load products."))
      .finally(() => setBrowseLoading(false));
  };

  useEffect(() => {
    const pending = checkoutPending;
    const orderId = pending?.order_id;
    const paymentStatus = pending?.payment?.status;
    if (!pending || !orderId || !paymentStatus || paymentStatus === "failed") return;
    const activeOrderId = orderId;
    if (
      ["cancelled", "refunded", "shipped", "fulfilled"].includes(checkoutOrderStatus ?? "") ||
      (checkoutOrderStatus === "accepted" && paymentStatus === "success")
    ) return;
    let cancelled = false;
    let inFlight = false;

    let lastVerificationAt = Date.now();
    async function refreshCheckoutStatus(verifyNow = false) {
      if (inFlight || cancelled) return;
      inFlight = true;
      try {
        let verifiedPayment: PaymentTransactionResponse | undefined;
        if (
          paymentStatus === "initialized" &&
          (verifyNow || Date.now() - lastVerificationAt >= 15000)
        ) {
          lastVerificationAt = Date.now();
          try {
            verifiedPayment = await apiClient.verifyPaymentByOrder(activeOrderId);
          } catch (error) {
            if (!cancelled) {
              setCheckoutStatusError(
                error instanceof Error ? error.message : "Could not verify payment with the provider.",
              );
            }
          }
        }
        const [order, payment] = await Promise.all([
          apiClient.getOrder(activeOrderId),
          apiClient.getPaymentByOrder(activeOrderId),
        ]);
        if (cancelled) return;
        const confirmedPayment =
          verifiedPayment?.status === "success" || verifiedPayment?.status === "failed"
            ? verifiedPayment
            : payment;
        setCheckoutOrderStatus(order.status);
        setCheckoutPending((current) =>
          current && current.order_id === activeOrderId
            ? { ...current, payment: confirmedPayment }
            : current,
        );
        if (confirmedPayment.status !== "initialized") {
          setCheckoutStatusError(null);
        }
        if (confirmedPayment.status === "failed") {
          paymentIdempotencyKey.current = null;
        }
      } catch (error) {
        if (!cancelled) {
          setCheckoutStatusError(
            error instanceof Error ? error.message : "Could not refresh payment status.",
          );
        }
      } finally {
        inFlight = false;
      }
    }

    const handleFocus = () => void refreshCheckoutStatus(true);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshCheckoutStatus(true);
    };
    void refreshCheckoutStatus();
    const timer = window.setInterval(() => void refreshCheckoutStatus(), 5000);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkoutPending?.order_id, checkoutPending?.payment?.status, checkoutOrderStatus]);

  const browseProductGroups = groupCatalogProducts(browseProducts);

  useEffect(() => { loadProducts(); }, []);

  // ---- Turn handling -------------------------------------------------
  // A turn = one user message and the agent's whole answer. Within a turn:
  //   1. text streams live into ONE bubble (coalesced to one render per frame),
  //   2. directives (results) are HELD, never shown mid-stream,
  //   3. when the stream ends everything is committed in one batch, text first,
  //      then the results, so the summary always precedes the results,
  //   4. the whole UI stays locked (searching = true) until that commit.
  const activeRef = useRef(false); // a turn is in flight; events are accepted
  const busyRef = useRef(false); // mirror of `searching`, readable from any closure
  const heldRef = useRef<UiDirective[]>([]);
  const errorRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastEventRef = useRef(0);
  const cartIntentRef = useRef(false); // this turn is about the cart: show only the cart
  const addedProductRef = useRef<string | null>(null); // product just added, to highlight its line
  const [pendingKinds, setPendingKinds] = useState<string[]>([]);

  function touch() {
    lastEventRef.current = Date.now();
  }
  function scheduleTextFlush() {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setStatusText(cleanAgentText(textBufferRef.current) || null);
    });
  }

  function finishTurn() {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const text = cleanAgentText(textBufferRef.current).trim();
    const error = errorRef.current;
    const cartIntent = cartIntentRef.current;
    const addedId = addedProductRef.current;
    const directives = dedupeDirectives(heldRef.current, text.length > 0, { cartIntent }).map((d) =>
      cartIntent && addedId && d.component === "CartSummary"
        ? ({ ...d, props: { ...d.props, highlight_product_id: addedId } } as UiDirective)
        : d,
    );
    textBufferRef.current = "";
    heldRef.current = [];
    errorRef.current = null;

    // Find the last CartSummary already displayed in the transcript.
    const lastCartMessage = [...chatMessagesRef.current]
      .reverse()
      .find((m) => m.directive?.component === "CartSummary");
    const lastKey = lastCartMessage ? cartKey(lastCartMessage.directive as UiDirective) : null;

    // Drop CartSummary directives whose content is identical to the one already shown.
    const freshDirectives = directives.filter((d) => {
      if (d.component === "CartSummary" && lastKey) {
        const newKey = cartKey(d);
        // A highlight_product_id prop means the shopper just added an item - that
        // is a *visual* change, so we still want to surface the cart this turn.
        const hasHighlight = Boolean((d.props as Record<string, unknown>)?.highlight_product_id);
        if (newKey === lastKey && !hasHighlight) return false;
      }
      return true;
    });

    let batch: Array<Partial<CanvasMessage>> = [];
    // Combine text + first directive into one message so the agent's prose
    // flows naturally into the UI widget (no visual "jump" between separate
    // bubbles).  Additional directives each get their own message.
    const firstDirective = freshDirectives[0];
    const restDirectives = freshDirectives.slice(1);
    if (text) {
      batch.push(firstDirective ? { content: text, directive: firstDirective } : { content: text });
    } else if (firstDirective) {
      batch.push({ directive: firstDirective });
    }
    for (const d of restDirectives) {
      batch.push({ directive: d });
      if (d.component === "CartSummary") {
        const n = Number((d.props as Record<string, unknown>).item_count);
        if (Number.isFinite(n)) setCartCount(n);
        settleCart("added");
      }
    }
    // If every CartSummary was deduped but we still have text, keep the text.
    // If everything was deduped with no text, don't add a blank message.
    if (error && error !== text) batch.push({ content: error });
    if (!batch.length) batch.push({ content: "I didn't quite catch a response — mind trying again?" });

    const msgs = batch.map(
      (m) =>
        ({
          id: String(++chatIdRef.current),
          role: "agent",
          timestamp: new Date(),
          ...m,
        }) as CanvasMessage,
    );
    setChatMessages((prev) => [...prev, ...msgs]); // one update = one render
    setStatusText(null);
    setPendingKinds([]);
    busyRef.current = false;
    cartIntentRef.current = false;
    addedProductRef.current = null;
    setSearching(false);
    settleCart("clear");
  }

  useEffect(() => {
    const stored = agentGateway.getStoredSessionId();
    agentGateway.connect(stored ?? undefined);
    agentGateway.setHandlers({
      onSession: () => {
        touch();
        setAgentConnected(true);
      },
      onText: (content) => {
        if (!activeRef.current || !content) return;
        touch();
        textBufferRef.current += content;
        scheduleTextFlush();
      },
      onDirective: (directive) => {
        if (!activeRef.current) return;
        touch();
        heldRef.current.push(directive);
        setPendingKinds(heldRef.current.map((d) => d.component));
      },
      onError: (error) => {
        if (!activeRef.current) return;
        touch();
        errorRef.current = error;
      },
      onEnd: () => finishTurn(),
    });
    // Never leave the UI locked if a stream stalls.
    const watchdog = window.setInterval(() => {
      if (activeRef.current && Date.now() - lastEventRef.current > 60_000) {
        errorRef.current = errorRef.current ?? "That's taking longer than usual — please try again.";
        finishTurn();
      }
    }, 5000);
    return () => {
      window.clearInterval(watchdog);
      agentGateway.disconnect();
    };
  }, []);

  function sendToAgent(
    text: string,
    confirmedToken?: string,
    opts?: { cart?: boolean; addedProductId?: string },
  ) {
    if (busyRef.current) return; // locked while the agent is responding
    if (!agentGateway.isConnected()) {
      settleCart("clear");
      pushChat({ role: "agent", content: "The assistant isn't reachable right now — please try again in a moment." });
      return;
    }
    cartIntentRef.current = !!opts?.cart;
    addedProductRef.current = opts?.addedProductId ?? null;
    busyRef.current = true;
    activeRef.current = true;
    touch();
    textBufferRef.current = "";
    heldRef.current = [];
    errorRef.current = null;
    setPendingKinds([]);
    setStatusText(null);
    setSearching(true);
    addUserMessage(text);
    void agentGateway.sendMessage(text, confirmedToken);
  }

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const resumeMessage = window.sessionStorage.getItem("mp_agent_resume_message");
    if (!resumeMessage) return;
    window.sessionStorage.removeItem("mp_agent_resume_message");
    sendToAgent(resumeMessage);
  }, [authLoading, isAuthenticated]);

  function handleChatSubmit(q: string) {
    const trimmed = q.trim();
    if (trimmed) sendToAgent(trimmed);
  }

  function handleClear() {
    if (busyRef.current) return;
    setChatMessages([]);
    chatIdRef.current = 0;
    setStatusText(null);
    setCartState({});
    textBufferRef.current = "";
  }

  // Cart feedback: a CartSummary directive confirms the add; anything else
  // (error, sign-in, end of turn) returns the button to idle without claiming success.
  function settleCart(outcome: "added" | "clear") {
    setCartState((prev) => {
      const next: CartState = {};
      for (const [id, s] of Object.entries(prev)) {
        if (s === "added" || (s === "adding" && outcome === "added")) next[id] = "added";
      }
      return next;
    });
    if (outcome === "added") {
      window.setTimeout(
        () =>
          setCartState((prev) =>
            Object.fromEntries(Object.entries(prev).filter(([, s]) => s !== "added")),
          ),
        2500,
      );
    }
  }

  /** Build a stable key for a CartSummary directive so identical carts aren't re-rendered. */
  function cartKey(d: UiDirective): string | null {
    const p = d.props as Record<string, unknown>;
    const items = (p.items as Array<Record<string, unknown>> | undefined) ?? [];
    const lines = items
      .map((i) => `${i.variant_id ?? ""}:${i.quantity ?? 0}`)
      .sort()
      .join(",");
    const subtotal = (p.subtotal as Record<string, unknown> | undefined) ?? {};
    return [String(p.item_count ?? items.length), lines, String(subtotal.amount ?? 0), String(subtotal.currency ?? "")].join("|");
  }

  function handleViewProduct(p: Product) {
    if (busyRef.current) return;
    // Related products: same category or same merchant, from the loaded catalog.
    const related = browseProducts
      .filter(
        (x) =>
          x.id !== p.id &&
          ((p.category_name && x.category_name === p.category_name) ||
            x.merchant_id === p.merchant_id),
      )
      .slice(0, 4);
    pushChat({
      role: "agent",
      directive: {
        type: "ui_directive",
        version: 1,
        component: "ProductDetail",
        props: { ...p, related } as unknown as Record<string, unknown>,
        correlation_id: `local-${chatIdRef.current + 1}`,
      } as UiDirective,
    });
  }

  function handleAddToCart(p: Product, quantity = 1) {
    if (busyRef.current) return;
    // Digital products and services are single-unit: only one copy can be added.
    const types = p.product_types ?? (p.fulfillment_type ? [p.fulfillment_type] : []);
    const singleUnit = types.includes("digital") || types.includes("service");
    const qty = singleUnit ? 1 : Math.max(1, quantity);
    setCartState((prev) => ({ ...prev, [p.id]: "adding" }));
    // After an add the next step is choosing the quantity, so the turn shows the cart, not product details.
    sendToAgent(
      qty > 1 ? `Add ${qty} of ${p.name} to my cart` : `Add ${p.name} to my cart`,
      undefined,
      { cart: true, addedProductId: p.id },
    );
  }

  // Quantities are absolute (idempotent): "set to N", and 0 removes the line.
  function handleCartUpdate(changes: CartChange[]) {
    if (busyRef.current || changes.length === 0) return;
    const parts = changes.map((c) =>
      c.quantity === 0
        ? `remove "${c.product_name}" (variant ${c.variant_id})`
        : `set "${c.product_name}" (variant ${c.variant_id}) to quantity ${c.quantity}`,
    );
    sendToAgent(`Update my cart: ${parts.join("; ")}.`, undefined, { cart: true });
  }

  function scrollToResults() {
    const grids = chatMessages.filter((m) => m.directive?.component === "ProductGrid");
    const last = grids[grids.length - 1];
    document
      .getElementById(last ? `msg-${last.id}` : "browse")
      ?.scrollIntoView({ block: "start" });
  }

  function getLatestCartItems(): Array<{ variant_id: string; product_id: string; quantity: number }> {
    const directive = [...chatMessagesRef.current]
      .reverse()
      .find((message) => message.directive?.component === "CartSummary")?.directive;
    const rawItems = (directive?.props as Record<string, unknown> | undefined)?.items;
    if (!Array.isArray(rawItems)) return [];
    return rawItems.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      if (
        typeof value.variant_id !== "string" ||
        typeof value.product_id !== "string" ||
        !Number.isInteger(value.quantity) ||
        Number(value.quantity) <= 0
      ) return [];
      return [{
        variant_id: value.variant_id,
        product_id: value.product_id,
        quantity: Number(value.quantity),
      }];
    });
  }

  function makeIdempotencyKey(): string {
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  async function createAgentOrder(address?: DeliveryAddress) {
    const checkout = pendingCheckout.current;
    if (!checkout || checkoutSubmitting) return;
    if (checkout.fulfillment === "delivery" && !address) {
      throw new Error("A delivery address is required for physical products.");
    }

    setCheckoutSubmitting(true);
    setPaymentError(null);
    setStatusText(null);
    try {
      const resp = await apiClient.checkout(checkout.items, {
        fulfillment_option: checkout.fulfillment,
        delivery_address: address as Record<string, unknown> | undefined,
        idempotency_key: checkout.idempotencyKey,
      });
      setCheckoutPending({
        order_id: String(resp.id),
        order_number: String(resp.order_number),
        status: String(resp.status),
        total_amount: Number(resp.total_amount),
        currency: String(resp.currency),
        fulfillment: checkout.fulfillment,
      });
      setCheckoutPanelOpen(true);
      setCheckoutOrderStatus(String(resp.status));
      setCheckoutStatusError(null);
      setPaymentError(null);
      setStatusText(null);
      setCheckoutSubmitting(false);
    } catch (error) {
      setCheckoutSubmitting(false);
      throw error instanceof Error ? error : new Error("Checkout failed. Please try again.");
    }
  }

  async function handleAgentCheckout() {
    if (!user?.id || user.role !== "buyer") {
      setStatusText("Sign in as a buyer to place your order.");
      return;
    }
    if (checkoutPending) {
      setCheckoutPanelOpen(true);
      return;
    }
    if (checkoutSubmitting) return;
    const retryCheckout = pendingCheckout.current;
    if (retryCheckout) {
      if (retryCheckout.fulfillment === "delivery") {
        pushChat({
          content: "A delivery address is needed for the physical items in your cart.",
          directive: {
            type: "ui_directive",
            version: 1,
            component: "DeliveryAddressForm",
            props: {},
            correlation_id: `checkout-address-${chatIdRef.current + 1}`,
          },
        });
        return;
      }
      try {
        await createAgentOrder();
      } catch (error) {
        setStatusText(error instanceof Error ? error.message : "Checkout failed. Please try again.");
      }
      return;
    }
    const cartItems = getLatestCartItems();
    if (!cartItems.length) {
      setStatusText("Your cart is empty or could not be validated. Refresh the cart and try again.");
      return;
    }

    setStatusText("Preparing checkout…");
    try {
      const productIds = [...new Set(cartItems.map((item) => item.product_id))];
      const products = await Promise.all(productIds.map((id) => apiClient.getProduct(id)));
      const byId = new Map(products.map((product) => [product.id, product]));
      if (cartItems.some((item) => !byId.has(item.product_id))) {
        throw new Error("One or more cart products are unavailable. Update your cart and try again.");
      }
      const fulfillment = resolveCheckoutFulfillment(products);
      pendingCheckout.current = {
        items: cartItems.map(({ variant_id, quantity }) => ({ variant_id, quantity })),
        fulfillment,
        idempotencyKey: makeIdempotencyKey(),
      };
      setStatusText(null);
      setPaymentError(null);
      if (fulfillment === "delivery") {
        pushChat({
          content: "A delivery address is needed for the physical items in your cart.",
          directive: {
            type: "ui_directive",
            version: 1,
            component: "DeliveryAddressForm",
            props: {},
            correlation_id: `checkout-address-${chatIdRef.current + 1}`,
          },
        });
        return;
      }
      await createAgentOrder();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Could not prepare checkout. Please try again.");
    }
  }

  async function handleDirectPayment() {
    if (!checkoutPending || paymentPaying) return;
    if (checkoutPending.payment?.payment_url) {
      window.open(checkoutPending.payment.payment_url, "_blank", "noopener,noreferrer");
      return;
    }
    setPaymentPaying(true);
    setPaymentError(null);
    try {
      if (checkoutPending.payment?.status === "failed") {
        paymentIdempotencyKey.current = null;
      }
      if (!paymentIdempotencyKey.current || paymentIdempotencyKey.current.orderId !== checkoutPending.order_id) {
        paymentIdempotencyKey.current = {
          orderId: checkoutPending.order_id,
          key: makeIdempotencyKey(),
        };
      }
      const response = await apiClient.processPayment(
        checkoutPending.order_id,
        "paystack",
        paymentIdempotencyKey.current.key,
      );
      if (!response.payment_url) {
        throw new Error("The payment provider did not return a payment link. Your order is safe; retry payment or contact support.");
      }
      setCheckoutPending((current) =>
        current?.order_id === checkoutPending.order_id
          ? { ...current, payment: response }
          : current,
      );
      window.open(response.payment_url, "_blank", "noopener,noreferrer");
      setPaymentError(null);
      setCheckoutStatusError(null);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Payment could not be started. You can safely retry.");
    } finally {
      setPaymentPaying(false);
    }
  }

  function handleAction(action: string, data?: unknown): void | Promise<void> {
    if (busyRef.current && action !== "cancel") return; // locked while the agent responds
    if (action === "view_product") {
      if (typeof data === "string") {
        // Open instantly from the loaded catalog when we can; else ask the agent.
        const local = browseProducts.find((x) => x.id === data);
        if (local) handleViewProduct(local);
        else sendToAgent(`Show me details for product ${data}`);
      } else {
        handleViewProduct(data as Product);
      }
    } else if (action === "add_to_cart") {
      const d = data as { product: Product; quantity?: number };
      handleAddToCart(d.product, d.quantity ?? 1);
    } else if (action === "update_cart") {
      handleCartUpdate(data as CartChange[]);
    } else if (action === "suggest") {
      sendToAgent(String(data));
    } else if (action === "back") {
      scrollToResults();
    } else if (action === "checkout") {
      return handleAgentCheckout();
    } else if (action === "submit_delivery_address") {
      if (!data || typeof data !== "object") {
        return Promise.reject(new Error("Enter a valid delivery address."));
      }
      return createAgentOrder(data as DeliveryAddress);
    } else if (action === "process_payment") {
      const d = data as { order_id?: string };
      if (d?.order_id && d.order_id !== checkoutPending?.order_id) return;
      return handleDirectPayment();
    } else if (action === "close_order_success") {
      setCheckoutPending(null);
      setCheckoutOrderStatus(null);
      setCheckoutStatusError(null);
      setPaymentError(null);
      setStatusText(null);
      pendingCheckout.current = null;
    } else if (action === "track_order") {
      // directive already rendered in chat
    } else if (action === "confirm") {
      // Confirmation token flow: the ConfirmationDialog passes a token here.
      // For direct checkout, the dialog's onConfirm already called handleDirectCheckout.
      // For agent actions, forward to the agent.
      const token = data as string | undefined;
      if (token) sendToAgent("Confirmed", token);
    } else if (action === "cancel") {
      setStatusText(null);
      setConfirmationDialog(null);
      setChatMessages((messages) =>
        messages.filter((message) => message.directive?.component !== "ConfirmationDialog"),
      );
    } else if (action === "sign_in") {
      if (typeof data === "string" && data.trim()) {
        window.sessionStorage.setItem("mp_agent_resume_message", data);
      }
      window.location.href = "/auth?returnTo=%2F";
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-foreground)]">
      {/* Header: brand + nav (no duplicate search bar) */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <a href="/" className="font-[var(--font-display)] text-xl font-semibold">
              MARKTO
            </a>
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-agent)]/20 text-[var(--color-agent)] font-semibold uppercase tracking-wide">
              AI
            </span>
          </div>
          {/* <a
            href="/landing"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            Marketing site
          </a> */}
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
            <button
              type="button"
              onClick={() => sendToAgent("Show my cart", undefined, { cart: true })}
              disabled={searching}
              aria-label={cartCount ? `Cart, ${cartCount} items` : "Cart"}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">Cart</span>
              {!!cartCount && (
                <span className="min-w-[20px] rounded-full bg-[var(--color-primary)] px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                  {cartCount}
                </span>
              )}
            </button>
            {isAuthenticated && user?.role === "buyer" && (
              <button
                type="button"
                onClick={() => setDigitalLibraryOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
              >
                <BookOpen size={14} />
                <span className="hidden sm:inline">My library</span>
              </button>
            )}
            {isAuthenticated && (user?.role === "merchant_owner" || user?.role === "merchant_staff") && (
              <a
                href="/merchant/dashboard"
                aria-label="Merchant Dashboard"
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
              >
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Merchant Dashboard</span>
              </a>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => logout().catch(() => {})}
                className="flex items-center gap-1.5 text-xs text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
              >
                <LogOut size={14} />{" "}
                <span className="max-w-[90px] truncate">{user?.first_name ?? "Account"}</span>
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

      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <AgentTranscript
          messages={chatMessages}
          starters={STARTER_PROMPTS}
          onSend={handleChatSubmit}
          onClear={handleClear}
          isSearching={searching}
          statusText={statusText}
          pendingKinds={pendingKinds}
          renderDirective={(d, meta) => (
            <RenderDirective directive={d} onAction={handleAction} cartState={cartState} readOnly={!meta.isLatest} />
          )}
        />

        <section
          id="browse"
          {...(searching ? ({ inert: "" } as Record<string, string>) : {})}
          className={"mt-10 scroll-mt-20 transition-opacity duration-200 " + (searching ? "opacity-70" : "")}
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Browse products</h2>
            <p className="text-sm text-[var(--color-muted)]">
              Showing up to 20 newest products, grouped by type.
            </p>
          </div>
          {browseLoading ? (
            <ProductGridSkeleton count={10} />
          ) : browseError ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-muted)]">
              <Package size={18} />
              <span>{browseError}</span>
              <button
                onClick={loadProducts}
                className="h-9 rounded-lg bg-[var(--color-primary)] px-4 font-medium text-white hover:bg-[var(--color-primary-hover)]"
              >
                Try again
              </button>
            </div>
          ) : (
            browseProducts.length === 0 ? (
              <ProductGrid products={[]} />
            ) : (
              <div className="space-y-10">
                {CATALOG_PRODUCT_SECTIONS.map(({ type, title }) => {
                  const products = browseProductGroups[type];
                  if (products.length === 0) return null;
                  return (
                    <section key={type} aria-labelledby={`browse-${type}-heading`}>
                      <h3 id={`browse-${type}-heading`} className="mb-4 text-lg font-semibold">
                        {title}
                      </h3>
                      <ProductGrid
                        products={products}
                        cartState={cartState}
                        onView={handleViewProduct}
                        onAddToCart={(p) => handleAddToCart(p)}
                      />
                    </section>
                  );
                })}
              </div>
            )
          )}
        </section>

        <AgentComposer
          placeholder="Search products or ask the agent…"
          onSend={handleChatSubmit}
          isSearching={searching}
        />
      </main>

      <footer className="max-w-7xl mx-auto px-5 sm:px-8 py-6 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-muted)]">
        <span>&copy; {new Date().getFullYear()} Markto. </span>
        <a
          href="/landing"
          className="underline hover:text-[var(--color-foreground)]"
        >
          Marketing site
        </a>
      </footer>

      {/* ── Agent checkout payment panel ── */}
      {checkoutPending && checkoutPanelOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Complete your order</h2>
                <p className="mt-1 text-xs text-[var(--color-muted)]">Order {checkoutPending.order_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutPanelOpen(false)}
                aria-label="Close checkout"
                className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-slate-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Total</span>
                <span className="font-semibold">{new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: checkoutPending.currency,
                  maximumFractionDigits: 0,
                }).format(checkoutPending.total_amount / 100)}</span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {checkoutPending.fulfillment === "delivery"
                  ? "After payment, the merchant will confirm and accept your order, then arrange normal delivery."
                  : checkoutPending.fulfillment === "digital"
                    ? "After payment, the merchant will confirm and accept your order. Your digital purchase will then be available in My library."
                    : "After payment, the merchant will confirm and accept your order, then contact you about service fulfillment."}
              </p>
            </div>

            {checkoutPending.payment?.status === "success" ? (
              <div className="rounded-lg border border-[var(--color-success-fg)]/20 bg-[var(--color-success-bg)]/20 p-4 text-sm">
                <p className="font-semibold text-[var(--color-success-fg)]">Payment confirmed by the provider.</p>
                <p className="mt-1 text-[var(--color-muted)]">
                  {checkoutOrderStatus === "accepted"
                    ? "The merchant has accepted the order."
                    : checkoutOrderStatus === "cancelled" || checkoutOrderStatus === "refunded"
                      ? `The order is ${checkoutOrderStatus}. Contact support if this status does not match your payment.`
                      : "Waiting for the merchant to accept your order."}
                </p>
                {checkoutPending.fulfillment === "digital" &&
                  checkoutOrderStatus === "accepted" && (
                    <button
                      type="button"
                      onClick={() => setDigitalLibraryOpen(true)}
                      className="mt-3 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                    >
                      Open My library
                    </button>
                  )}
              </div>
            ) : checkoutPending.payment?.status === "failed" ? (
              <p role="alert" className="rounded-lg bg-[var(--color-danger-bg)] p-3 text-sm text-[var(--color-danger-fg)]">
                Payment failed. Retry securely; your order remains available and will not be duplicated.
              </p>
            ) : checkoutPending.payment ? (
              <div className="rounded-lg border border-[var(--color-warning-fg)]/20 bg-[var(--color-warning-bg)]/20 p-4 text-sm">
                <p className="font-medium">Payment is {checkoutPending.payment.status}.</p>
                <p className="mt-1 text-[var(--color-muted)]">Complete payment in the provider window. We’re checking for confirmation automatically.</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Secure payment is required before the merchant can process this order.
              </p>
            )}

            {checkoutPending.payment?.payment_url && checkoutPending.payment.status !== "success" && (
              <a
                href={checkoutPending.payment.payment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
              >
                Complete payment
              </a>
            )}

            {!checkoutPending.payment || checkoutPending.payment.status === "failed" ? (
              <button
                type="button"
                onClick={() => void handleDirectPayment()}
                disabled={paymentPaying}
                className="w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {paymentPaying ? "Starting secure payment…" : checkoutPending.payment?.status === "failed" ? "Retry payment" : "Pay securely with Paystack"}
              </button>
            ) : null}

            {paymentError && <p role="alert" className="text-sm text-[var(--color-danger-fg)]">{paymentError}</p>}
            {checkoutStatusError && (
              <p role="alert" className="text-sm text-[var(--color-warning-fg)]">
                Could not refresh payment status: {checkoutStatusError}. The payment link remains available; try again shortly.
              </p>
            )}
            {checkoutPending.payment?.status === "success" &&
              checkoutPending.fulfillment !== "digital" &&
              checkoutOrderStatus === "accepted" && (
                <p className="rounded-lg bg-[var(--color-success-bg)]/20 p-3 text-sm text-[var(--color-success-fg)]">
                  Your order is accepted. Follow its status in your order updates while the merchant completes fulfillment.
                </p>
              )}
            <div className="flex justify-end">
              {checkoutOrderStatus === "accepted" && checkoutPending.payment?.status === "success" && (
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutPending(null);
                    setCheckoutPanelOpen(false);
                    setCheckoutOrderStatus(null);
                    setCheckoutStatusError(null);
                    setPaymentError(null);
                    pendingCheckout.current = null;
                    paymentIdempotencyKey.current = null;
                  }}
                  className="mr-auto rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-slate-50"
                >
                  Start another order
                </button>
              )}
              <button
                type="button"
                onClick={() => setCheckoutPanelOpen(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-slate-50"
              >
                {checkoutPending.payment ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {digitalLibraryOpen && (
        <DigitalLibrary onClose={() => setDigitalLibraryOpen(false)} />
      )}

      {/* ── Confirmation dialog overlay ──
          Used for checkout confirmation so the buyer never has to type
          "confirm" into the chat. */}
      {confirmationDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <ConfirmationDialog
              title={confirmationDialog.title}
              message={confirmationDialog.message}
              onConfirm={() => {
                confirmationDialog.onConfirm();
                setConfirmationDialog(null);
              }}
              onCancel={() => setConfirmationDialog(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}