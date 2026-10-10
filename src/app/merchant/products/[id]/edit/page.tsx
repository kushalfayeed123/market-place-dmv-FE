import { MerchantRouteGuard } from "@/components/merchant/MerchantRouteGuard";
import { EditProductForm } from "./EditProductForm";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return (
    <MerchantRouteGuard>
      <EditProductForm productId={id} />
    </MerchantRouteGuard>
  );
}