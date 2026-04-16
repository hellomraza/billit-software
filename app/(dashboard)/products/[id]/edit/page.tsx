"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/shared/product-form";
import { getProductById } from "@/lib/mock-data/product";
import { ROUTES } from "@/lib/routes";
import { Product } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product data on component mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsFetching(true);
        setError(null);
        const prod = await getProductById(productId);

        if (!prod) {
          setError("Product not found");
          toast.error("Product not found", {
            description: "The product you're trying to edit does not exist.",
          });
          router.push(ROUTES.PRODUCTS);
          return;
        }

        setProduct(prod);
      } catch (err) {
        setError("Failed to load product");
        toast.error("Failed to load product", {
          description: "An error occurred while fetching the product.",
        });
        console.error("Error fetching product:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleSave = async (data: any) => {
    try {
      setIsSaving(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Persist to localStorage for imported products
      const importedStr = localStorage.getItem("billit_imported_products");
      let allProducts = importedStr ? JSON.parse(importedStr) : [];

      const updatedProduct: Product = {
        ...product!,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      // Find and update product in imported list (if exists)
      const importedIndex = allProducts.findIndex(
        (p: any) => p.id === productId,
      );

      if (importedIndex !== -1) {
        allProducts[importedIndex] = updatedProduct;
        localStorage.setItem(
          "billit_imported_products",
          JSON.stringify(allProducts),
        );
      }

      toast.success("Product updated successfully", {
        description: "Changes will apply to future invoices only.",
      });

      router.push(ROUTES.PRODUCTS);
    } catch (err) {
      toast.error("Failed to save product", {
        description: "An error occurred while saving the product.",
      });
      console.error("Error saving product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while fetching product
  if (isFetching) {
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
        <PageHeader
          title="Edit Product"
          breadcrumbs={[
            { label: "Products", href: ROUTES.PRODUCTS },
            { label: "Edit Product" },
          ]}
        />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <div className="text-sm">Loading product details...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !product) {
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
        <PageHeader
          title="Edit Product"
          breadcrumbs={[
            { label: "Products", href: ROUTES.PRODUCTS },
            { label: "Edit Product" },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-semibold">
              {error || "Product not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <PageHeader
        title={`Edit Product: ${product.name}`}
        breadcrumbs={[
          { label: "Products", href: ROUTES.PRODUCTS },
          { label: "Edit Product" },
        ]}
      />

      {/* Invoice Snapshot Behavior Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-lg max-w-4xl">
        <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-2 flex items-center gap-2">
          <span>📋</span> Invoice Snapshot Behavior
        </h3>
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          Changes made here (Base Price, GST Rate) will{" "}
          <strong>only affect future invoices</strong>. All past invoices remain
          immutable snapshot records with their original prices and tax rates.
          Stock adjustments apply immediately to fulfillment tracking.
        </p>
      </div>

      <div className="flex-1 overflow-auto pb-8">
        <ProductForm
          initialData={product}
          onSubmit={handleSave}
          onCancel={() => router.push(ROUTES.PRODUCTS)}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
