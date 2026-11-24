// src/app/s/[code]/page.tsx — Server Component entrypoint for shared links.
// Do NOT add "use client" here (same ActionQueueContext rule as src/app/page.tsx).
// The client component below reads the code from the URL, resolves it, and
// routes the visitor into the main agent-driven product page.

import ShareLinkPage from "./ShareLinkPage";

export default function Page({ params }: { params: { code: string } }) {
  return <ShareLinkPage code={params.code} />;
}
