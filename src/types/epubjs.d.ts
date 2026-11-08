declare module "epubjs" {
  export interface Rendition {
    display(target?: string): Promise<unknown>;
    next(): Promise<unknown>;
    prev(): Promise<unknown>;
    destroy(): void;
  }

  export interface Book {
    ready: Promise<unknown>;
    renderTo(element: HTMLElement, options: Record<string, unknown>): Rendition;
    destroy(): void;
  }

  export default function ePub(book: string | ArrayBuffer): Book;
}
