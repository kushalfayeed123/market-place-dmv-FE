"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Loader2, Minus, PackagePlus, Plus } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { formatMoney } from "@/components/catalog/format";
import { Field, inputCls, Notice } from "./ui";
import { addVariant, updateVariant, type VariantPatch } from "./variantApi";
import {
  fromMinorUnits,
  generateSku,
  stockState,
  toMinorUnits,
  type InventoryPolicy,
  type StockState,
  type VariantView,
} from "./productUtils";

const POLICIES: { value: InventoryPolicy; label: string }[] = [
  { value: "tracked", label: "Tracked: count units, stop at 0" },
  { value: "untracked", label: "Untracked: don't count units" },
  { value: "unlimited", label: "Unlimited: never runs out" },
];

const BADGE: Record<StockState, { text: string; cls: string }> = {
  in: { text: "In stock", cls: "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]" },
  low: { text: "Low stock", cls: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]" },
  out: { text: "Out of stock", cls: "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]" },
  unlimited: { text: "Unlimited", cls: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" },
  untracked: { text: "Not counted", cls: "bg-slate-100 text-slate-600" },
};

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError || e instanceof Error ? e.message : fallback;

function QtyStepper({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const n = Number(value);
  const ok = value.trim() !== "" && Number.isInteger(n) && n >= 0;
  const bump = (d: number) => onChange(String(Math.max(0, (ok ? n : 0) + d)));
  const btn = "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] disabled:opacity-40";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" disabled={disabled} onClick={() => bump(-1)} aria-label="Decrease stock by 1" className={btn}><Minus size={16} /></button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          disabled={disabled}
          aria-invalid={!ok}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls + " text-center font-semibold"}
          aria-label="Units available"
        />
        <button type="button" disabled={disabled} onClick={() => bump(1)} aria-label="Increase stock by 1" className={btn}><Plus size={16} /></button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[-10, 10, 50].map((d) => (
          <button key={d} type="button" disabled={disabled} onClick={() => bump(d)} className="h-8 rounded-full border border-[var(--color-border)] px-3 text-xs hover:border-[var(--color-primary)] disabled:opacity-40">
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
        <button type="button" disabled={disabled} onClick={() => onChange("0")} className="h-8 rounded-full border border-[var(--color-border)] px-3 text-xs hover:border-[var(--color-danger)] disabled:opacity-40">
          Mark sold out
        </button>
      </div>
    </div>
  );
}

function VariantCard({
  productId,
  currency,
  variant,
  onSaved,
  onDirtyChange,
}: {
  productId: string;
  currency: string;
  variant: VariantView;
  onSaved: (v: VariantView) => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
}) {
  const [sku, setSku] = useState(variant.sku);
  const [qty, setQty] = useState(String(variant.quantity_available ?? 0));
  const [policy, setPolicy] = useState<InventoryPolicy>(variant.inventory_policy);
  const [price, setPrice] = useState(variant.price_override_amount != null ? String(fromMinorUnits(variant.price_override_amount)) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-sync drafts when the saved variant changes (after save).
  useEffect(() => {
    setSku(variant.sku);
    setQty(String(variant.quantity_available ?? 0));
    setPolicy(variant.inventory_policy);
    setPrice(variant.price_override_amount != null ? String(fromMinorUnits(variant.price_override_amount)) : "");
  }, [variant]);

  const qtyNum = Number(qty);
  const qtyValid = qty.trim() !== "" && Number.isInteger(qtyNum) && qtyNum >= 0;
  const priceNum = price.trim() === "" ? null : Number(price);
  const priceValid = priceNum === null || (Number.isFinite(priceNum) && priceNum >= 0);

  const patch: VariantPatch = {};
  if (sku.trim() && sku.trim() !== variant.sku) patch.sku = sku.trim();
  if (policy !== variant.inventory_policy) patch.inventory_policy = policy;
  if (qtyValid && qtyNum !== (variant.quantity_available ?? 0)) patch.quantity_available = qtyNum;
  const nextOverride = priceNum === null ? null : priceValid ? toMinorUnits(priceNum) : variant.price_override_amount;
  if (priceValid && nextOverride !== variant.price_override_amount) {
    patch.price_override_amount = nextOverride;
    patch.price_override_currency = nextOverride === null ? null : currency;
  }
  const dirty = Object.keys(patch).length > 0;
  const canSave = dirty && qtyValid && priceValid && sku.trim() !== "" && !saving;

  useEffect(() => {
    onDirtyChange(variant.id, dirty);
    return () => onDirtyChange(variant.id, false);
  }, [dirty, variant.id, onDirtyChange]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await updateVariant(productId, variant.id, patch));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(errText(e, "Couldn't save this variant. Try again."));
    } finally {
      setSaving(false);
    }
  }

  const badge = BADGE[stockState(variant)];
  const attrs = Object.entries(variant.attributes);

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-[var(--font-mono)] text-sm font-semibold">{variant.sku}</span>
          {attrs.map(([k, v]) => (
            <span key={k} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{k}: {String(v)}</span>
          ))}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>{badge.text}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Units available"
          hint={
            policy === "tracked"
              ? variant.quantity_reserved > 0
                ? `${variant.quantity_reserved} reserved in open orders.`
                : "How many units you can sell right now."
              : "Units aren't counted for this stock setting."
          }
          error={!qtyValid ? "Enter a whole number, 0 or more." : undefined}
        >
          <QtyStepper value={qty} onChange={setQty} disabled={policy !== "tracked" || saving} />
        </Field>

        <div className="space-y-4">
          <Field label="Stock setting" htmlFor={`pol-${variant.id}`}>
            <select id={`pol-${variant.id}`} value={policy} disabled={saving} onChange={(e) => setPolicy(e.target.value as InventoryPolicy)} className={inputCls + " bg-white"}>
              {POLICIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="SKU" htmlFor={`sku-${variant.id}`}>
            <input id={`sku-${variant.id}`} value={sku} disabled={saving} onChange={(e) => setSku(e.target.value)} className={inputCls + " font-[var(--font-mono)]"} />
          </Field>
        </div>

        <Field
          label="Price for this variant (optional)"
          htmlFor={`price-${variant.id}`}
          className="sm:col-span-2"
          error={!priceValid ? "Enter a valid price or leave blank." : undefined}
          hint={priceNum !== null && priceValid ? `Customers pay ${formatMoney(toMinorUnits(priceNum), currency)} for this variant.` : "Leave blank to use the product's base price."}
        >
          <input id={`price-${variant.id}`} type="number" inputMode="decimal" min={0} step="0.01" value={price} disabled={saving} placeholder="Same as base price" onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </Field>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="inline-flex items-center gap-1 text-sm text-[var(--color-success-fg)]"><Check size={15} /> Saved</span>}
        <button type="button" onClick={save} disabled={!canSave} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40">
          {saving && <Loader2 size={15} className="animate-spin" />} Save stock changes
        </button>
      </div>
    </div>
  );
}

function AddVariant({ productId, productTitle, onAdded, startOpen }: { productId: string; productTitle: string; onAdded: (v: VariantView) => void; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [optName, setOptName] = useState("");
  const [optValue, setOptValue] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("0");
  const [policy, setPolicy] = useState<InventoryPolicy>("tracked");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qtyNum = Number(qty);
  const qtyValid = qty.trim() !== "" && Number.isInteger(qtyNum) && qtyNum >= 0;

  async function submit() {
    if (!qtyValid) return;
    setSaving(true);
    setError(null);
    try {
      const attributes = optName.trim() && optValue.trim() ? { [optName.trim()]: optValue.trim() } : {};
      onAdded(await addVariant(productId, { sku: sku.trim() || generateSku(productTitle), attributes, quantity_available: qtyNum, inventory_policy: policy }));
      setOptName(""); setOptValue(""); setSku(""); setQty("0"); setPolicy("tracked");
      setOpen(false);
    } catch (e) {
      setError(errText(e, "Couldn't add the variant."));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
        <PackagePlus size={16} /> Add a variant
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-slate-50 p-4">
      <p className="text-sm font-medium">New variant</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Option name" htmlFor="nv-name" hint="For example Size or Color. Leave blank for a single version."><input id="nv-name" value={optName} onChange={(e) => setOptName(e.target.value)} placeholder="Size" className={inputCls} /></Field>
        <Field label="Option value" htmlFor="nv-value"><input id="nv-value" value={optValue} onChange={(e) => setOptValue(e.target.value)} placeholder="Large" className={inputCls} /></Field>
        <Field label="SKU" htmlFor="nv-sku" hint="Auto-generated if left empty."><input id="nv-sku" value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls + " font-[var(--font-mono)]"} /></Field>
        <Field label="Stock setting" htmlFor="nv-pol">
          <select id="nv-pol" value={policy} onChange={(e) => setPolicy(e.target.value as InventoryPolicy)} className={inputCls + " bg-white"}>
            {POLICIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Units available" error={!qtyValid ? "Enter a whole number, 0 or more." : undefined} className="sm:col-span-2">
          <QtyStepper value={qty} onChange={setQty} disabled={policy !== "tracked"} />
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg px-4 text-sm text-[var(--color-muted)] hover:bg-slate-100">Cancel</button>
        <button type="button" onClick={submit} disabled={saving || !qtyValid} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40">
          {saving && <Loader2 size={15} className="animate-spin" />} Add variant
        </button>
      </div>
    </div>
  );
}

export function VariantStock({
  productId,
  productTitle,
  currency,
  variants,
  onVariantsChange,
  onUnsavedChange,
}: {
  productId: string;
  productTitle: string;
  currency: string;
  variants: VariantView[];
  onVariantsChange: (next: VariantView[]) => void;
  onUnsavedChange: (unsaved: boolean) => void;
}) {
  const dirtyIds = useRef(new Set<string>());
  const onDirtyChange = useCallback(
    (id: string, dirty: boolean) => {
      if (dirty) dirtyIds.current.add(id);
      else dirtyIds.current.delete(id);
      onUnsavedChange(dirtyIds.current.size > 0);
    },
    [onUnsavedChange],
  );

  // The product form wraps this; Enter inside a field must not submit that form.
  const stopEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
  };

  return (
    <div className="space-y-4" onKeyDown={stopEnter}>
      {variants.length === 0 && (
        <Notice tone="warning">This product has no variants yet, so customers can't buy it. Add one below to set stock.</Notice>
      )}
      {variants.map((v) => (
        <VariantCard
          key={v.id}
          productId={productId}
          currency={currency}
          variant={v}
          onDirtyChange={onDirtyChange}
          onSaved={(next) => onVariantsChange(variants.map((x) => (x.id === next.id ? next : x)))}
        />
      ))}
      <AddVariant
        productId={productId}
        productTitle={productTitle}
        startOpen={variants.length === 0}
        onAdded={(v) => onVariantsChange([...variants, v])}
      />
    </div>
  );
}
