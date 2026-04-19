import { PageHeader } from "@/components/shared/page-header";
import { CreateProductForm } from "@/features/products/create-product-form";

export default function CreateProductPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-4xl mx-auto">
      <PageHeader
        title="Create Product"
        description="Add a new product to your catalog"
      />

      <CreateProductForm />
    </div>
  );
}
