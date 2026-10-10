"use client";

import { ProductForm } from "@/components/merchant/product/ProductForm";

export function EditProductForm({ productId }: { productId: string }) {
  return <ProductForm mode="edit" productId={productId} />;
}
