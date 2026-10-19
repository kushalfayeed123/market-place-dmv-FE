import { MerchantRouteGuard } from "@/components/merchant/MerchantRouteGuard";
import { MerchantOrderDetail } from "@/components/merchant/MerchantOrderDetail";

interface MerchantOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

/** Merchant order detail page.
 *
 * Shows the items, buyer, total, mode of payment, and order actions for a
 * single order. Mirrors the auth-gating pattern used by the product edit page.
 */
export default async function MerchantOrderDetailPage({
  params,
}: MerchantOrderDetailPageProps) {
  const { id } = await params;
  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
      <MerchantRouteGuard>
        <MerchantOrderDetail orderId={id} />
      </MerchantRouteGuard>
    </main>
  );
}
