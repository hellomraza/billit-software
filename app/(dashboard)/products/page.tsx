import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProductTable2 } from "@/features/products/ProductTable2";
import { getProducts } from "@/lib/api/products";
import { ROUTES } from "@/lib/routes";
import { Download, Plus } from "lucide-react";
import Link from "next/link";

export default async function ProductsPage() {
  const productsResponse = await getProducts({ includeDeleted: true });
  const products = productsResponse.data;

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col">
      <PageHeader
        title="Products"
        actions={[
          <Link href={ROUTES.PRODUCTS_IMPORT} key="import">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 px-3 text-xs sm:text-sm"
            >
              <Download className=" h-4 w-4" />
              <span>Import CSV</span>
            </Button>
          </Link>,
          <Link href={ROUTES.PRODUCTS_NEW} key="new">
            <Button size="sm" className="gap-2 h-9 px-3 text-xs sm:text-sm">
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </Link>,
        ]}
      />

      <div className="flex-1 overflow-auto">
        <ProductTable2 products={products} />
      </div>
    </div>
  );
}
