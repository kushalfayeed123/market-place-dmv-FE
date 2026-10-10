import { MerchantRouteGuard } from "@/components/merchant/MerchantRouteGuard";
import { AddProductForm } from "./AddProductForm";

export default function AddProductPage() {
  return (
    <MerchantRouteGuard>
      <AddProductForm />
    </MerchantRouteGuard>
  );
}
