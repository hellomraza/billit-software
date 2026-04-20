import { PageHeader } from "@/components/shared/page-header";
import { ProductImportForm } from "@/features/products/product-import-form";
import { ROUTES } from "@/lib/routes";

export default function ImportProductsPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Import Products via CSV"
        breadcrumbs={[
          { label: "Products", href: ROUTES.PRODUCTS },
          { label: "Import" },
        ]}
      />

      <ProductImportForm />
    </div>
  );
}
