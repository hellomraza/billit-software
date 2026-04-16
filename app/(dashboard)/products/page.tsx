"use client";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/features/products/product-table";
import { getProducts } from "@/lib/mock-data/product";
import { ROUTES } from "@/lib/routes";
import { Download, PackageSearch, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      setIsLoading(true);
      getProducts()
        .then((mockProducts) => {
          // Load imported products from localStorage
          const importedStr = localStorage.getItem("billit_imported_products");
          const importedProducts = importedStr ? JSON.parse(importedStr) : [];

          // Merge: imported products first, then mock products
          const allProducts = [...importedProducts, ...mockProducts];
          setProducts(allProducts);
        })
        .catch((error) => {
          toast.error("Failed to load products", {
            description: "Please try refreshing the page.",
          });
          console.error("Error loading products:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      toast.error("Error loading products", {
        description: "An unexpected error occurred.",
      });
      console.error("Error:", error);
      setIsLoading(false);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.productCode?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleDeleteInitial = (product: any) => setDeleteCandidate(product);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      // Simulate deletion delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const updatedProducts = products.map((p) =>
        p.id === deleteCandidate.id ? { ...p, isDeleted: true } : p,
      );
      setProducts(updatedProducts);

      // Persist changes to localStorage for imported products
      const importedStr = localStorage.getItem("billit_imported_products");
      if (importedStr) {
        const imported = JSON.parse(importedStr);
        const updated = imported.map((p: any) =>
          p.id === deleteCandidate.id ? { ...p, isDeleted: true } : p,
        );
        localStorage.setItem(
          "billit_imported_products",
          JSON.stringify(updated),
        );
      }

      toast.success("Product marked as deleted");
      setDeleteCandidate(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = (product: any) => {
    const updatedProducts = products.map((p) =>
      p.id === product.id ? { ...p, isDeleted: false } : p,
    );
    setProducts(updatedProducts);

    // Persist changes to localStorage for imported products
    const importedStr = localStorage.getItem("billit_imported_products");
    if (importedStr) {
      const imported = JSON.parse(importedStr);
      const updated = imported.map((p: any) =>
        p.id === product.id ? { ...p, isDeleted: false } : p,
      );
      localStorage.setItem("billit_imported_products", JSON.stringify(updated));
    }

    toast.success("Product restored");
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="animate-in slide-in-from-top duration-500 delay-100">
        <PageHeader
          title="Products"
          actions={[
            <Button key="import" variant="outline">
              <Link href={ROUTES.PRODUCTS_IMPORT}>
                <Download className="mr-2 h-4 w-4" /> Import CSV
              </Link>
            </Button>,
            <Button key="new">
              <Link href={ROUTES.PRODUCTS_NEW}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Link>
            </Button>,
          ]}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start animate-in slide-in-from-top duration-500 delay-150">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search products..."
          className="w-full sm:max-w-xs"
        />
        <Button
          variant="ghost"
          onClick={() => setShowDeleted(!showDeleted)}
          className="text-muted-foreground transition-colors duration-200"
        >
          {showDeleted ? "Hide Deleted" : "Show Deleted"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto animate-in fade-in duration-500 delay-200">
        {products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No Products Yet"
            description="No products found in your catalog. Create your first product or import a CSV to get started."
            actionLabel="Add Product"
            onAction={() => router.push(ROUTES.PRODUCTS_NEW)}
            className="mt-8"
          />
        ) : (
          <ProductTable
            products={filteredProducts}
            showDeleted={showDeleted}
            onDelete={handleDeleteInitial}
            onRestore={handleRestore}
            isLoading={isLoading}
          />
        )}
      </div>

      <ConfirmationDialog
        isOpen={!!deleteCandidate}
        title="Delete Product"
        description={`Are you sure you want to delete ${deleteCandidate?.name}? This will hide it from active billing but maintain references in past invoices.`}
        confirmText="Delete"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
}
