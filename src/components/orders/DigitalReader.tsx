"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, LoaderCircle, X } from "lucide-react";
import mammoth from "mammoth";
import ePub, { type Book, type Rendition } from "epubjs";
import type { DigitalProductFileDownloadResponse } from "@/lib/api/client";

interface DigitalReaderProps {
  title: string;
  file: DigitalProductFileDownloadResponse;
  onClose: () => void;
}

const allowedDocxTags = new Set([
  "A", "B", "BLOCKQUOTE", "BR", "CAPTION", "CODE", "DD", "DIV", "DL", "DT",
  "EM", "H1", "H2", "H3", "H4", "HR", "I", "LI", "OL", "P", "PRE", "S",
  "IMG", "STRONG", "SUB", "SUP", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "U", "UL",
]);
const discardedDocxTags = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "FORM"]);

function sanitizeDocxHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const safeDocument = document.implementation.createHTMLDocument("");

  function copySafeNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return safeDocument.createTextNode(node.textContent ?? "");
    }
    if (!(node instanceof Element)) return null;
    if (discardedDocxTags.has(node.tagName)) return null;

    if (!allowedDocxTags.has(node.tagName)) {
      const fragment = safeDocument.createDocumentFragment();
      node.childNodes.forEach((child) => {
        const safeChild = copySafeNode(child);
        if (safeChild) fragment.appendChild(safeChild);
      });
      return fragment;
    }

    const element = safeDocument.createElement(node.tagName.toLowerCase());
    if (node.tagName === "A") {
      const href = node.getAttribute("href");
      if (href) {
        try {
          const url = new URL(href, window.location.origin);
          if (["http:", "https:", "mailto:"].includes(url.protocol)) {
            element.setAttribute("href", url.href);
            element.setAttribute("rel", "noopener noreferrer");
            element.setAttribute("target", "_blank");
          }
        } catch {
          // Ignore malformed document links.
        }
      }
    }
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") ?? "";
      if (/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(src)) {
        element.setAttribute("src", src);
      }
      const alt = node.getAttribute("alt");
      if (alt) element.setAttribute("alt", alt);
      return element;
    }
    node.childNodes.forEach((child) => {
      const safeChild = copySafeNode(child);
      if (safeChild) element.appendChild(safeChild);
    });
    return element;
  }

  parsed.body.childNodes.forEach((node) => {
    const safeNode = copySafeNode(node);
    if (safeNode) safeDocument.body.appendChild(safeNode);
  });
  return safeDocument.body.innerHTML;
}

function ReaderFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-0 flex-1 overflow-auto bg-slate-100 p-4 sm:p-8"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && ["p", "s"].includes(event.key.toLowerCase())) {
          event.preventDefault();
        }
      }}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function DigitalReader({ title, file, onClose }: DigitalReaderProps) {
  const epubContainer = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const format = file.format.toLowerCase();

  useEffect(() => {
    let cancelled = false;

    async function loadReader() {
      try {
        if (format === "docx") {
          const response = await fetch(file.download_url);
          if (!response.ok) throw new Error("The Word document could not be loaded.");
          const result = await mammoth.convertToHtml({ arrayBuffer: await response.arrayBuffer() });
          if (!cancelled) setDocxHtml(sanitizeDocxHtml(result.value));
          return;
        }

        if (format === "epub") {
          if (!epubContainer.current) return;
          const book = ePub(file.download_url);
          bookRef.current = book;
          await book.ready;
          if (cancelled || !epubContainer.current) return;
          const rendition = book.renderTo(epubContainer.current, {
            width: "100%",
            height: "100%",
            spread: "none",
          });
          renditionRef.current = rendition;
          await rendition.display();
          return;
        }

        if (format !== "pdf") {
          setError(
            format === "doc"
              ? "Legacy .doc files cannot be displayed in the reader. Please contact the seller for a .docx or PDF copy."
              : `The ${format || "unknown"} file format is not supported by this reader.`,
          );
        }
      } catch {
        if (!cancelled) {
          setError(
            format === "epub" || format === "docx"
              ? "Could not load this document. The storage bucket must allow browser reads from this site (S3 CORS)."
              : "Could not load this digital product.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReader();
    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [file.download_url, format]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="digital-reader-title"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BookOpen size={19} className="shrink-0 text-[var(--color-primary)]" />
          <div className="min-w-0">
            <h2 id="digital-reader-title" className="truncate text-sm font-semibold text-[var(--color-foreground)]">
              {title}
            </h2>
            <p className="text-xs uppercase text-[var(--color-muted)]">{format}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {format === "epub" && (
            <>
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => void renditionRef.current?.prev()}
                className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-foreground)] hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => void renditionRef.current?.next()}
                className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-foreground)] hover:bg-slate-50"
              >
                <ArrowRight size={16} />
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Close reader"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <ReaderFrame>
        {loading && (
          <p className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
            <LoaderCircle size={18} className="animate-spin" /> Loading your document…
          </p>
        )}
        {error && (
          <p role="alert" className="mx-auto flex max-w-lg items-start gap-2 rounded-xl bg-white p-5 text-sm text-[var(--color-danger-fg)] shadow">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        {!error && format === "pdf" && (
          <iframe
            title={title}
            src={`${file.download_url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="h-full min-h-[70vh] w-full border-0 bg-white"
            referrerPolicy="no-referrer"
          />
        )}
        {!error && format === "epub" && (
          <div ref={epubContainer} className="mx-auto h-full min-h-[70vh] max-w-4xl bg-white shadow" />
        )}
        {!loading && !error && format === "docx" && (
          <article
            className="mx-auto max-w-4xl space-y-4 bg-white p-6 text-[var(--color-foreground)] shadow sm:p-12"
            dangerouslySetInnerHTML={{ __html: docxHtml ?? "" }}
          />
        )}
      </ReaderFrame>
      <footer className="shrink-0 border-t border-[var(--color-border)] px-4 py-2 text-center text-xs text-[var(--color-muted)]">
        Reading view only. Download controls are hidden where supported; this cannot prevent screenshots or copying.
      </footer>
    </div>
  );
}
