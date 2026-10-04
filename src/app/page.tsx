// src/app/page.tsx — Server Component entrypoint for the App Router.
// Do NOT add "use client" here. Next.js 14's internal router contexts
// (ActionQueueContext, action async storage, navigation state) are
// established at the Server Component boundary; making page.tsx a Client
// Component short-circuits that and causes:
//   "Invariant: Missing ActionQueueContext" → hydration failure.
//
// Everything interactive lives in ./App.tsx (which stays "use client").

import App from "@/App";

export default function Page() {
  return <App />;
}
