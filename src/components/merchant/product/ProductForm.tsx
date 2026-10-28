"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Loader2, Package, Pencil } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { apiClient, ApiError } from "@/lib/api/client";
import type { CategoryResponse, Product, ProductUpdate, StoreResponse } from "@/lib/api/client";
import type { ProductAttributeSchemaResponse } from "@/lib/api/client";
import { formatMoney } from "@/components/catalog/format";

import { ImageManager, type ImageItem, type ImageStatus } from "./ImageManager";
import { ListingChecklist } from "./ListingChecklist";
import { VariantStock } from "./VariantStock";
import { ChoiceCards, Field, Notice, Section, inputCls, textareaCls } from "./ui";
import {
  currencySymbol,
  fromMinorUnits,
  generateSku,
  getReadiness,
  isSellable,
  slugify,
  toMinorUnits,
  toVariantView,
  type VariantView,
} from "./productUtils";

const schema = z.object({
  title: z.string().trim().min(1, "Give your product a title").max(200, "Keep the title under 200 characters"),
  slug: z.string().trim().max(120).optional(),
  description: z.string().max(5000, "Keep the description under 5,000 characters").optional(),
  fulfillment_type: z.enum(["physical", "digital", "service"]),
  base_price_amount: z
    .number({ invalid_type_error: "Enter a price" })
    .min(0, "Price can't be negative"),
  base_price_currency: z.string().length(3),
  category_id: z.string().optional(),
  status: z.enum(["draft", "active", "suspended"]),
  sku: z.string().trim().max(64).optional(),
  quantity_available: z
    .number({ invalid_type_error: "Enter a stock quantity" })
    .int("Use whole units")
    .min(0, "Stock can't be negative"),
  inventory_policy: z.enum(["tracked", "untracked", "unlimited"]),
});
type FormValues = z.infer<typeof schema>;
type Intent = "draft" | "publish";

const DEFAULTS: FormValues = {
  title: "",
  slug: "",
  description: "",
  fulfillment_type: "physical",
  base_price_amount: 0,
  base_price_currency: "NGN",
  category_id: "",
  status: "draft",
  sku: "",
  quantity_available: 0,
  inventory_policy: "tracked",
};

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError || e instanceof Error ? e.message : fallback;

const PRODUCTS_URL = "/merchant/dashboard?section=products";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]",
    draft: "bg-slate-100 text-slate-600",
    suspended: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${map[status] ?? map.draft}`}>
      {status === "active" ? "Listed" : status}
    </span>
  );
}

export function ProductForm({ mode, productId }: { mode: "create" | "edit"; productId?: string }) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<VariantView[]>([]);
  const [initialUrls, setInitialUrls] = useState<string[]>([]);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [imgStatus, setImgStatus] = useState<Record<string, ImageStatus>>({});
  const [attrSchema, setAttrSchema] = useState<Record<string, unknown> | null>(null);
  const [attrValues, setAttrValues] = useState<Record<string, unknown>>({});
  const [initialAttrValues, setInitialAttrValues] = useState<Record<string, unknown>>({});

  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugUnlocked, setSlugUnlocked] = useState(false);
  const [stockUnsaved, setStockUnsaved] = useState(false);
  const [done, setDone] = useState(false);

  // Resume state for create: a retry never creates a second product or re-uploads photos.
  const progress = useRef({ productId: null as string | null, variantDone: false, uploaded: new Set<string>() });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS, mode: "onTouched" });

  const w = watch();
  const busy = phase !== null;

  /* ---------- load ---------- */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      setLoadError(null);
      try {
        if (isEdit) {
          const [cats, prod] = await Promise.all([apiClient.getCategories(), apiClient.getProduct(productId!)]);
          if (cancelled) return;
          setCategories(cats ?? []);
          setProduct(prod);
          setVariants((prod.variants ?? []).map((v) => toVariantView(v)));
          const urls = prod.urls ?? [];
          setInitialUrls(urls);
          setItems(urls.map((url) => ({ id: crypto.randomUUID(), kind: "existing" as const, url })));
          setAttrValues((prod.attributes as Record<string, unknown>) ?? {});
          setInitialAttrValues((prod.attributes as Record<string, unknown>) ?? {});
          reset({
            ...DEFAULTS,
            title: prod.title,
            slug: prod.slug ?? "",
            description: prod.description ?? "",
            fulfillment_type: prod.fulfillment_type as FormValues["fulfillment_type"],
            base_price_amount: fromMinorUnits(prod.base_price_amount),
            base_price_currency: prod.base_price_currency,
            category_id: prod.category_id ?? "",
            status: prod.status as FormValues["status"],
          });
        } else {
          const merchant = await apiClient.getMyMerchant(user.id);
          const [storesData, cats] = await Promise.all([apiClient.getMyStores(merchant.id), apiClient.getCategories()]);
          if (cancelled) return;
          setStores(storesData ?? []);
          setCategories(cats ?? []);
        }
      } catch (e) {
        if (!cancelled) setLoadError(errText(e, "Failed to load the form."));
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isEdit, productId, reset]);

  // Create: slug follows the title until the merchant edits it. Edit: never auto-changes (it's the live URL).
  useEffect(() => {
    if (!isEdit && !slugTouched) setValue("slug", slugify(w.title ?? ""));
  }, [isEdit, slugTouched, w.title, setValue]);

  // ── Fetch attribute schema when category changes ──────────────────
  useEffect(() => {
    if (!w.category_id) {
      setAttrSchema(null);
      setAttrValues({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiClient.getAttributeSchema(w.category_id!);
        if (cancelled) return;
        if (resp) {
          setAttrSchema(resp.json_schema as Record<string, unknown>);
        } else {
          setAttrSchema(null);
        }
      } catch {
        // No schema for this category â€” that's fine, attributes are optional.
        setAttrSchema(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [w.category_id]);

  /* ---------- derived ---------- */
  const imagesDirty =
    isEdit &&
    (items.length !== initialUrls.length ||
      items.some((it, i) => it.kind === "new" || it.url !== initialUrls[i]));
  const dirtyAny = isDirty || imagesDirty || stockUnsaved || (!isEdit && items.length > 0);

  useEffect(() => {
    if (!dirtyAny || done) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirtyAny, done]);

  const price = Number.isFinite(w.base_price_amount) ? w.base_price_amount : 0;
  const readiness = getReadiness({
    title: w.title ?? "",
    price,
    categoryId: w.category_id ?? "",
    description: w.description ?? "",
    imageCount: items.length,
    fulfillment: w.fulfillment_type,
    hasVariant: isEdit ? variants.length > 0 : true,
    hasSellableStock: isEdit
      ? variants.some(isSellable)
      : w.inventory_policy !== "tracked" || (Number.isFinite(w.quantity_available) && w.quantity_available > 0),
  });

  /* ---------- actions ---------- */
  function finish() {
    setDone(true);
    window.dispatchEvent(new Event("merchant:refresh"));
    router.push(PRODUCTS_URL);
  }

  async function runCreate(data: FormValues, why: Intent) {
    if (!stores.length) {
      setError("No store found. Complete your merchant setup before adding products.");
      return;
    }
    const p = progress.current;
    let pid = p.productId;
    if (!pid) {
      setPhase("Creating product…");
      const created = await apiClient.createProduct({
        title: data.title.trim(),
        slug: data.slug || undefined,
        description: data.description?.trim() || undefined,
        fulfillment_type: data.fulfillment_type,
        base_price_amount: toMinorUnits(data.base_price_amount),
        base_price_currency: data.base_price_currency,
        category_id: data.category_id || undefined,
        attributes: Object.keys(attrValues).length > 0 ? attrValues : undefined,
        status: "draft", // never visible until stock and photos exist
      });
      pid = created.id;
      p.productId = pid;
      setCreatedId(pid);
    }
    if (!p.variantDone) {
      setPhase("Setting up stock…");
      await apiClient.createProductVariant(pid, {
        sku: data.sku || generateSku(data.title),
        attributes: {},
        price_override_amount: null,
        price_override_currency: null,
        inventory_policy: data.inventory_policy,
        quantity_available: data.quantity_available,
        quantity_reserved: 0,
      });
      p.variantDone = true;
    }
    const pending = items.filter((i) => i.kind === "new" && !p.uploaded.has(i.id));
    for (let n = 0; n < pending.length; n++) {
      const it = pending[n];
      if (it.kind !== "new") continue;
      setPhase(`Uploading photo ${n + 1} of ${pending.length}…`);
      setImgStatus((s) => ({ ...s, [it.id]: "uploading" }));
      try {
        await apiClient.uploadProductImage(pid, it.file);
      } catch (e) {
        setImgStatus((s) => ({ ...s, [it.id]: "error" }));
        throw new Error(
          `Photo ${n + 1} failed to upload (${errText(e, "network error")}). Your product is saved as a draft. Press the button again to retry, or remove that photo.`,
        );
      }
      p.uploaded.add(it.id);
      setImgStatus((s) => ({ ...s, [it.id]: "done" }));
    }
    if (why === "publish") {
      setPhase("Publishing…");
      await apiClient.updateProduct(pid, { status: "active" });
    }
    finish();
  }

  async function runEdit(data: FormValues) {
    const pid = productId!;
    if (dirtyFields.status && data.status === "active" && !readiness.ready) {
      setError(`Before listing, finish: ${readiness.missing.map((m) => m.label.toLowerCase()).join(", ")}.`);
      return;
    }
    const payload: ProductUpdate = {};
    if (dirtyFields.title) payload.title = data.title.trim();
    if (dirtyFields.slug) payload.slug = data.slug || undefined;
    if (dirtyFields.description) payload.description = data.description ?? "";
    if (dirtyFields.fulfillment_type) payload.fulfillment_type = data.fulfillment_type;
    if (dirtyFields.base_price_amount || dirtyFields.base_price_currency) {
      payload.base_price_amount = toMinorUnits(data.base_price_amount);
      payload.base_price_currency = data.base_price_currency;
    }
    if (dirtyFields.category_id) payload.category_id = data.category_id || null;
    if (dirtyFields.status) payload.status = data.status;

    // Include attributes if they have changed
    const attrChanged =
      Object.keys(attrValues).length !== Object.keys(initialAttrValues).length ||
      Object.keys(attrValues).some((k) => attrValues[k] !== initialAttrValues[k]);
    if (attrChanged) payload.attributes = attrValues;

    // 1) fields + removed/reordered existing photos
    const existing = items.flatMap((i) => (i.kind === "existing" ? [i.url] : []));
    const existingChanged = existing.length !== initialUrls.length || existing.some((u, i) => u !== initialUrls[i]);
    if (Object.keys(payload).length || existingChanged) {
      setPhase("Saving changes…");
      await apiClient.updateProduct(pid, { ...payload, ...(existingChanged ? { urls: existing } : {}) });
    }
    let serverUrls = existingChanged ? existing : initialUrls;

    // 2) upload new photos; map each file to the URL the server added
    const resolved: ImageItem[] = [...items];
    const newCount = resolved.filter((i) => i.kind === "new").length;
    let failed = 0;
    let n = 0;
    for (let i = 0; i < resolved.length; i++) {
      const it = resolved[i];
      if (it.kind !== "new") continue;
      n++;
      setPhase(`Uploading photo ${n} of ${newCount}…`);
      setImgStatus((s) => ({ ...s, [it.id]: "uploading" }));
      try {
        const prod = await apiClient.uploadProductImage(pid, it.file);
        const urls = prod.urls ?? [];
        const added = urls.find((u) => !serverUrls.includes(u));
        serverUrls = urls;
        if (added) resolved[i] = { id: it.id, kind: "existing", url: added };
        setImgStatus((s) => ({ ...s, [it.id]: "done" }));
      } catch {
        failed++;
        setImgStatus((s) => ({ ...s, [it.id]: "error" }));
      }
    }

    // 3) final photo order
    const desired = resolved.flatMap((i) => (i.kind === "existing" ? [i.url] : []));
    if (desired.length === serverUrls.length && desired.some((u, i) => u !== serverUrls[i])) {
      setPhase("Saving photo order…");
      await apiClient.updateProduct(pid, { urls: desired });
      serverUrls = desired;
    }

    if (failed > 0) {
      setItems(resolved);
      setInitialUrls(serverUrls);
      reset(data);
      setError(`${failed} photo${failed > 1 ? "s" : ""} failed to upload. Your other changes are saved. Press Save changes to retry, or remove the failed photo.`);
      return;
    }
    finish();
  }

  const submit = (why: Intent) =>
    handleSubmit(
      async (data) => {
        setError(null);
        setIntent(why);
        try {
          if (isEdit) await runEdit(data);
          else await runCreate(data, why);
        } catch (e) {
          setError(errText(e, "Something went wrong. Please try again."));
        } finally {
          setPhase(null);
          setIntent(null);
        }
      },
      () => {
        setError("Some fields need attention. They're highlighted below.");
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
      },
    )();

  /* ---------- render ---------- */
  if (pageLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-2 text-[var(--color-muted)]">
        <Loader2 size={18} className="animate-spin" /> Loading product form…
      </div>
    );
  }
  if (loadError || (isEdit && !product)) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <Notice tone={loadError ? "error" : "warning"}>{loadError ?? "Product not found."}</Notice>
        <Link href={PRODUCTS_URL} className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
          <ChevronLeft size={14} /> Back to products
        </Link>
      </div>
    );
  }

  const currency = w.base_price_currency || "NGN";
  const locked = !isEdit && createdId !== null; // after the draft exists, core fields are frozen until it finishes
  const inputErr = (k: keyof FormValues) => (errors[k] ? true : undefined);

  return (
    <div className="mx-auto w-full max-w-3xl pb-6">
      <Link href={PRODUCTS_URL} className="mb-4 inline-flex h-9 items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
        <ChevronLeft size={15} /> Back to products
      </Link>

      <header className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Package size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold text-[var(--color-foreground)]">
            {isEdit ? product!.title : "Add a product"}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {isEdit ? "Update details, photos, pricing and stock." : "Fill in the basics, then save as a draft or list it on the marketplace."}
          </p>
        </div>
        {isEdit && <StatusPill status={product!.status} />}
      </header>

      <div className="mb-5 space-y-3" aria-live="polite">
        {error && <Notice tone="error">{error}</Notice>}
        {!isEdit && !stores.length && !loadError && (
          <Notice tone="warning">No store found. Complete your merchant setup before adding products.</Notice>
        )}
        {locked && (
          <Notice tone="info">
            Your draft was created. Only the remaining steps will be retried; to change other details, finish here and open the product from your list.
          </Notice>
        )}
      </div>

      <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-5">
        <fieldset disabled={locked || busy} className="contents">
          <Section title="Basics" description="What shoppers see first.">
            <Field label="Product title" htmlFor="title" required error={errors.title?.message}>
              <input id="title" type="text" autoComplete="off" placeholder="e.g. Handcrafted leather wallet" aria-invalid={inputErr("title")} {...register("title")} className={inputCls} />
            </Field>

            <Field
              label="URL slug"
              htmlFor="slug"
              hint={isEdit ? "Changing this changes the product's web address, and old links will stop working." : "Generated from the title. Edit it if you want a custom address."}
              error={errors.slug?.message}
            >
              <div className="flex gap-2">
                <input
                  id="slug"
                  type="text"
                  readOnly={isEdit && !slugUnlocked}
                  {...register("slug", { onChange: () => setSlugTouched(true) })}
                  className={inputCls + " font-[var(--font-mono)] " + (isEdit && !slugUnlocked ? "bg-slate-50 text-slate-500" : "")}
                />
                {isEdit && !slugUnlocked && (
                  <button type="button" onClick={() => setSlugUnlocked(true)} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-sm hover:border-[var(--color-primary)]">
                    <Pencil size={14} /> Change
                  </button>
                )}
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" htmlFor="category_id" required hint="Required to list, so shoppers and the search agent can find it.">
                <select id="category_id" {...register("category_id")} className={inputCls + " bg-white"}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-medium">Product type</p>
                <ChoiceCards
                  name="fulfillment_type"
                  columns={3}
                  value={w.fulfillment_type}
                  onChange={(v) => {
                    setValue("fulfillment_type", v, { shouldDirty: true });
                    if (!isEdit) setValue("inventory_policy", v === "physical" ? "tracked" : "unlimited");
                  }}
                  options={[
                    { value: "physical", label: "Physical" },
                    { value: "digital", label: "Digital" },
                    { value: "service", label: "Service" },
                  ]}
                />
              </div>
            </div>

            <Field label="Description" htmlFor="description" error={errors.description?.message} hint={`${(w.description ?? "").length}/5000. Materials, size, care, what's included.`}>
              <textarea id="description" placeholder="Describe your product…" aria-invalid={inputErr("description")} {...register("description")} className={textareaCls} />
            </Field>

            {/* Dynamic attribute fields based on the category's JSON schema */}
            {attrSchema && (() => {
              const properties = (attrSchema.properties as Record<string, Record<string, unknown>>) ?? {};
              const requiredFields = (attrSchema.required as string[]) ?? [];
              const allFields = Object.keys(properties);
              if (allFields.length === 0) return null;
              return (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    Product attributes
                  </p>
                  {allFields.map((field) => {
                    const prop = properties[field] ?? {};
                    const isRequired = requiredFields.includes(field);
                    const placeholder = prop.placeholder as string | undefined;
                    return (
                      <Field
                        key={field}
                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                        htmlFor={`attr-${field}`}
                        required={isRequired}
                        hint={isRequired ? "Required" : "Optional"}
                      >
                        <input
                          id={`attr-${field}`}
                          type="text"
                          placeholder={placeholder ?? field}
                          value={(attrValues[field] as string) ?? ""}
                          onChange={(e) =>
                            setAttrValues((prev) => ({
                              ...prev,
                              [field]: e.target.value || undefined,
                            }))
                          }
                          className={inputCls}
                        />
                      </Field>
                    );
                  })}
                </div>
              );
            })()}
          </Section>

        </fieldset>

        {/* Photos stay editable after a draft is created so a failed upload can be removed or retried. */}
        <Section title="Photos" description="Products with clear photos sell better. You need at least one to list.">
          <ImageManager items={items} onChange={setItems} status={imgStatus} disabled={busy} />
        </Section>

        <fieldset disabled={locked || busy} className="contents">
          <Section title="Pricing">
            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                label="Price"
                htmlFor="base_price_amount"
                required
                className="sm:col-span-2"
                error={errors.base_price_amount?.message}
                hint={price > 0 ? `Customers will see ${formatMoney(toMinorUnits(price), currency)}.` : "Price for one unit."}
              >
                <div className="flex">
                  <span className="inline-flex h-11 items-center rounded-l-lg border border-r-0 border-[var(--color-border)] bg-slate-50 px-3.5 text-sm text-[var(--color-muted)]">
                    {currencySymbol(currency)}
                  </span>
                  <input
                    id="base_price_amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    aria-invalid={inputErr("base_price_amount")}
                    {...register("base_price_amount", { valueAsNumber: true })}
                    className={inputCls + " rounded-l-none"}
                  />
                </div>
              </Field>
              <Field label="Currency" htmlFor="base_price_currency">
                <select id="base_price_currency" {...register("base_price_currency")} className={inputCls + " bg-white"}>
                  <option value="NGN">Naira (NGN)</option>
                  <option value="USD">Dollar (USD)</option>
                  <option value="GBP">Pound (GBP)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </Field>
            </div>
          </Section>

          {!isEdit && (
            <Section title="Stock" description="Set how many units you have. You can change this any time.">
              <ChoiceCards
                name="inventory_policy"
                value={w.inventory_policy}
                onChange={(v) => setValue("inventory_policy", v, { shouldDirty: true })}
                options={[
                  { value: "tracked", label: "Tracked", hint: "Count units and stop selling at 0." },
                  { value: "untracked", label: "Untracked", hint: "Don't count units." },
                  { value: "unlimited", label: "Unlimited", hint: "Never runs out." },
                ]}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Units in stock" htmlFor="quantity_available" required error={errors.quantity_available?.message} hint={w.inventory_policy === "tracked" ? undefined : "Not used with this stock setting."}>
                  <input id="quantity_available" type="number" inputMode="numeric" min="0" step="1" disabled={w.inventory_policy !== "tracked"} aria-invalid={inputErr("quantity_available")} {...register("quantity_available", { valueAsNumber: true })} className={inputCls} />
                </Field>
                <Field label="SKU" htmlFor="sku" hint="Your own code for this item. Auto-generated if left empty.">
                  <input id="sku" type="text" placeholder="Auto-generated" {...register("sku")} className={inputCls + " font-[var(--font-mono)]"} />
                </Field>
              </div>
            </Section>
          )}
        </fieldset>

        {isEdit && (
          <Section
            title="Stock and variants"
            description="Update units on hand, change the stock setting, or add another size or color. Each variant saves on its own."
          >
            <VariantStock
              productId={productId!}
              productTitle={w.title || product!.title}
              currency={currency}
              variants={variants}
              onVariantsChange={setVariants}
              onUnsavedChange={setStockUnsaved}
            />
          </Section>
        )}

        <Section title="Listing" description={isEdit ? "Control whether this product appears on the marketplace." : "What this product needs before it can go live."}>
          {isEdit && (
            <ChoiceCards
              name="status"
              columns={3}
              value={w.status}
              onChange={(v) => setValue("status", v, { shouldDirty: true })}
              options={[
                { value: "draft", label: "Draft", hint: "Not visible to shoppers." },
                { value: "active", label: "Active", hint: "Listed on the marketplace." },
                { value: "suspended", label: "Suspended", hint: "Not visible to shoppers." },
              ]}
            />
          )}
          <ListingChecklist items={readiness.items} ready={readiness.ready} />
        </Section>
      </form>

      <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur">
        <p className="px-1 text-sm text-[var(--color-muted)]" aria-live="polite">
          {busy ? phase : dirtyAny ? (stockUnsaved ? "Unsaved stock changes" : "Unsaved changes") : isEdit ? "All changes saved" : "Drafts stay private until you publish."}
        </p>
        <div className="flex gap-2">
          <Link href={PRODUCTS_URL} className="inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium text-[var(--color-muted)] hover:bg-slate-100">
            Cancel
          </Link>
          {isEdit ? (
            <button type="button" onClick={() => submit("draft")} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50">
              {busy && <Loader2 size={16} className="animate-spin" />} Save changes
            </button>
          ) : (
            <>
              <button type="button" onClick={() => submit("draft")} disabled={busy || !stores.length} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm font-semibold hover:border-[var(--color-primary)] disabled:opacity-50">
                {busy && intent === "draft" && <Loader2 size={16} className="animate-spin" />} {createdId ? "Retry" : "Save as draft"}
              </button>
              <button
                type="button"
                onClick={() => submit("publish")}
                disabled={busy || !stores.length || !readiness.ready}
                title={readiness.ready ? undefined : `Still needed: ${readiness.missing.map((m) => m.label.toLowerCase()).join(", ")}`}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy && intent === "publish" && <Loader2 size={16} className="animate-spin" />} {createdId ? "Retry and publish" : "Create and publish"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
