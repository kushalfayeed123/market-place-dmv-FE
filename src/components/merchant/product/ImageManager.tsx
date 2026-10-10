"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { MAX_IMAGES, MAX_IMAGE_BYTES } from "./productUtils";

export type ImageItem =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; preview: string };

export type ImageStatus = "uploading" | "done" | "error";

export function ImageManager({
  items,
  onChange,
  status = {},
  disabled,
}: {
  items: ImageItem[];
  onChange: (next: ImageItem[]) => void;
  status?: Record<string, ImageStatus>;
  disabled?: boolean;
}) {
  const inputId = useId();
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const latest = useRef(items);
  latest.current = items;

  // Free object URLs on unmount.
  useEffect(
    () => () => {
      latest.current.forEach((i) => i.kind === "new" && URL.revokeObjectURL(i.preview));
    },
    [],
  );

  function addFiles(files: File[]) {
    const problems: string[] = [];
    const room = MAX_IMAGES - items.length;
    const accepted: ImageItem[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) problems.push(`${f.name} is not an image`);
      else if (f.size > MAX_IMAGE_BYTES) problems.push(`${f.name} is over 5 MB`);
      else if (accepted.length >= room) problems.push(`Only ${MAX_IMAGES} photos allowed`);
      else accepted.push({ id: crypto.randomUUID(), kind: "new", file: f, preview: URL.createObjectURL(f) });
    }
    setNotice(problems.length ? Array.from(new Set(problems)).join(". ") + "." : null);
    if (accepted.length) onChange([...items, ...accepted]);
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) addFiles(Array.from(e.dataTransfer.files));
  };

  function remove(id: string) {
    const it = items.find((i) => i.id === id);
    if (it?.kind === "new") URL.revokeObjectURL(it.preview);
    onChange(items.filter((i) => i.id !== id));
  }
  function move(idx: number, delta: number) {
    const to = idx + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[idx], next[to]] = [next[to], next[idx]];
    onChange(next);
  }
  function makeCover(idx: number) {
    if (idx === 0) return;
    const next = [...items];
    const [it] = next.splice(idx, 1);
    onChange([it, ...next]);
  }

  const dropProps = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); if (!disabled) setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop,
  };
  const dropCls =
    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition " +
    (dragging
      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
      : "border-[var(--color-border)] bg-slate-50 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]") +
    (disabled ? " pointer-events-none opacity-50" : "");

  return (
    <div className="space-y-3">
      <input id={inputId} type="file" accept="image/*" multiple onChange={onPick} className="sr-only" disabled={disabled} />

      {items.length === 0 ? (
        <label htmlFor={inputId} className={dropCls + " px-6 py-10"} {...dropProps}>
          <ImagePlus size={28} className="text-[var(--color-primary)]" />
          <span className="text-sm font-medium">Drop photos here or click to choose</span>
          <span className="text-xs text-[var(--color-muted)]">PNG, JPG, WebP or GIF, up to 5 MB each. The first photo is the cover.</span>
        </label>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((it, idx) => {
            const src = it.kind === "existing" ? it.url : it.preview;
            const st = status[it.id];
            return (
              <li
                key={it.id}
                className={"group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-slate-100 " + (idx === 0 ? "col-span-2 row-span-2" : "aspect-square")}
              >
                <img src={src} alt={`Product photo ${idx + 1}`} className="h-full w-full object-cover" />
                {idx === 0 && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-medium shadow-sm">
                    <Star size={12} className="fill-[var(--color-accent)] text-[var(--color-accent)]" /> Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  disabled={disabled}
                  aria-label={`Remove photo ${idx + 1}`}
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:bg-white hover:text-[var(--color-danger)]"
                >
                  <X size={15} />
                </button>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/50 to-transparent p-1.5 text-white">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(idx, -1)} disabled={disabled || idx === 0} aria-label="Move earlier" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30">
                      <ChevronLeft size={15} />
                    </button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={disabled || idx === items.length - 1} aria-label="Move later" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  {idx !== 0 && (
                    <button type="button" onClick={() => makeCover(idx)} disabled={disabled} className="rounded-full bg-black/40 px-2 py-1 text-xs hover:bg-black/60">
                      Make cover
                    </button>
                  )}
                </div>
                {st === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>
                )}
                {st === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/80 text-xs font-medium text-[var(--color-danger-fg)]">
                    <AlertCircle size={18} /> Upload failed
                  </div>
                )}
              </li>
            );
          })}
          {items.length < MAX_IMAGES && (
            <li className="aspect-square">
              <label htmlFor={inputId} className={dropCls + " h-full"} {...dropProps}>
                <ImagePlus size={20} className="text-[var(--color-primary)]" />
                <span className="text-xs font-medium">Add more</span>
              </label>
            </li>
          )}
        </ul>
      )}

      <p className="text-xs text-[var(--color-muted)]">
        {items.length}/{MAX_IMAGES} photos. Use the arrows to reorder; the first photo is shown on search results.
      </p>
      {notice && <p role="alert" className="text-sm text-[var(--color-danger-fg)]">{notice}</p>}
    </div>
  );
}
