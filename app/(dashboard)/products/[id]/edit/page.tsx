"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/shared/product-form";
import { ROUTES } from "@/lib/routes";
import { MOCK_PRODUCTS } from "@/lib/mock-data/product";
import { Product } from "@/types";
import { toast } from "sonner";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Mock fetch
    const prod = MOCK_PRODUCTS.find(p => p.id === params.id);
    if (prod) setProduct(prod);
    else {
      toast.error("Product not found");
      router.push(ROUTES.PRODUCTS);
    }
  }, [params.id, router]);

  const handleSave = async (data: any) => {
    // Mock API
    toast.success("Product updated successfully", {
      description: "Changes will apply to future invoices only."
    });
    router.push(ROUTES.PRODUCTS);
  };

  if (!product) return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <PageHeader 
        title="Edit Product" 
        breadcrumbs={[
          { label: "Products", href: ROUTES.PRODUCTS },
          { label: "Edit Product" }
        ]}
      />
      <div className="bg-warning/10 border border-warning/20 p-3 rounded-md mb-4 max-w-4xl">
        <p className="text-sm text-warning-foreground font-medium">
          Changes to Base Price or GST will only affect future invoices. Past invoices are immutable snapshot records.
        </p>
      </div>
      <div className="flex-1 overflow-auto pb-8">
        <ProductForm 
          initialData={product}
          onSubmit={handleSave} 
          onCancel={() => router.push(ROUTES.PRODUCTS)} 
        />
      </div>
    </div>
  );
}
