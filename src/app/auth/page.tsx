// src/app/auth/page.tsx — Server Component entrypoint for the /auth route.
// Next.js internal router contexts (ActionQueueContext, action async storage,
// navigation state) are established at the Server Component boundary.
// AuthProvider is already provided by layout.tsx; AuthFlow is a client component.

import { AuthFlow } from "@/components/auth/AuthFlow";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <AuthFlow />
    </div>
  );
}