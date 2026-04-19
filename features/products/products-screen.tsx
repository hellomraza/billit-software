"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteProductAction } from "@/actions/products";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/features/products/product-table";
import { ROUTES } from "@/lib/routes";
import { ProductWithStock } from "@/lib/utils/products";
import { Download, PackageSearch, Plus } from "lucide-react";
import Link from "next/link";

interface ProductsScreenProps {
  products: ProductWithStock[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export function ProductsScreen({ products, pagination }: ProductsScreenProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteCandidate, setDeleteCandidate] =
    useState<ProductWithStock | null>(null);

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query);
  });

  const handleDeleteInitial = (product: ProductWithStock) =>
    setDeleteCandidate(product);

  const [isDeleting, startTransition] = useTransition();

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    startTransition(async () => {
      await deleteProductAction({ productId: deleteCandidate._id });
    });
  };

  const handleRestore = async (product: ProductWithStock) => {
    try {
      // TODO: Call restoreProductAction when D.7 is implemented
      // await restoreProductAction({ productId: product._id });

      toast.success("Product restored");
    } catch (error: any) {
      toast.error("Failed to restore product", {
        description: error.message,
      });
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-[1400px] mx-auto">
      <div>
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

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search products..."
          className="w-full sm:max-w-xs"
        />
        <Button
          variant="ghost"
          onClick={() => setShowDeleted(!showDeleted)}
          className="text-muted-foreground transition-colors"
        >
          {showDeleted ? "Hide Deleted" : "Show Deleted"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No Products Found"
            description={
              products.length === 0
                ? "No products yet. Create your first product or import a CSV to get started."
                : "No products match your search. Try adjusting your search terms."
            }
            actionLabel={products.length === 0 ? "Add Product" : undefined}
            onAction={
              products.length === 0
                ? () => router.push(ROUTES.PRODUCTS_NEW)
                : undefined
            }
            className="mt-8"
          />
        ) : (
          <ProductTable
            products={filteredProducts}
            showDeleted={showDeleted}
            onDelete={handleDeleteInitial}
            onRestore={handleRestore}
            isLoading={false}
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
