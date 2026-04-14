"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/shared/product-form";
import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    // Mock API
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success("Product created successfully");
    router.push(ROUTES.PRODUCTS);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <PageHeader 
        title="Add Product" 
        breadcrumbs={[
          { label: "Products", href: ROUTES.PRODUCTS },
          { label: "New Product" }
        ]}
      />
      <div className="flex-1 overflow-auto pb-8">
        <ProductForm 
          onSubmit={handleSave} 
          onCancel={() => router.push(ROUTES.PRODUCTS)} 
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
