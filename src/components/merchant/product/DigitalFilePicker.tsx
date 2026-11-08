"use client";

import { useId, useState, type ChangeEvent } from "react";
import { FileText, X } from "lucide-react";
import { DIGITAL_FILE_ACCEPT, getDigitalFileContentType } from "./digitalFileUtils";

export function DigitalFilePicker({
  file,
  onChange,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;

    if (!getDigitalFileContentType(selected)) {
      setError("Choose a PDF, EPUB, or Word document (.docx).");
      return;
    }

    setError(null);
    onChange(selected);
  }

  return (
    <div className="space-y-3">
      <input
        id={inputId}
        type="file"
        accept={DIGITAL_FILE_ACCEPT}
        onChange={onPick}
        className="sr-only"
        disabled={disabled}
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-slate-50 p-4">
          <FileText size={22} className="shrink-0 text-[var(--color-primary)]" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            disabled={disabled}
            aria-label="Remove digital product file"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-white hover:text-[var(--color-danger)] disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-slate-50 px-6 py-10 text-center transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
        >
          <FileText size={28} className="text-[var(--color-primary)]" />
          <span className="text-sm font-medium">Choose a digital product file</span>
          <span className="text-xs text-[var(--color-muted)]">PDF, EPUB, or Word (.docx)</span>
        </label>
      )}
      {error && <p role="alert" className="text-sm text-[var(--color-danger-fg)]">{error}</p>}
    </div>
  );
}
