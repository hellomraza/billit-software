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

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<any>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteInitial = (product: any) => setDeleteCandidate(product);

  const handleConfirmDelete = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === deleteCandidate.id ? { ...p, isDeleted: true } : p,
      ),
    );
    toast.success("Product marked as deleted");
    setDeleteCandidate(null);
  };

  const handleRestore = (product: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isDeleted: false } : p)),
    );
    toast.success("Product restored");
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-[1400px] mx-auto">
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

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search products..."
          className="w-full sm:max-w-xs"
        />
        <Button
          variant="ghost"
          onClick={() => setShowDeleted(!showDeleted)}
          className="text-muted-foreground"
        >
          {showDeleted ? "Hide Deleted" : "Show Deleted"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
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
          />
        )}
      </div>

      <ConfirmationDialog
        isOpen={!!deleteCandidate}
        title="Delete Product"
        description={`Are you sure you want to delete ${deleteCandidate?.name}? This will hide it from active billing but maintain references in past invoices.`}
        confirmText="Delete"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
}
