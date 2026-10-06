import { Suspense } from "react";
import { MerchantDashboard } from "./MerchantDashboard";

// Suspense is required because the dashboard reads ?section= via useSearchParams.
export default function MerchantDashboardPage() {
  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
      <Suspense fallback={null}><MerchantDashboard /></Suspense>
    </main>
  );
}
