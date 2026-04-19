import { PageHeader } from "@/components/shared/page-header";
import { EditProductForm } from "@/features/products/edit-product-form";
import { getProduct } from "@/lib/api/products";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-4xl mx-auto">
      <PageHeader
        title="Edit Product"
        description={`Editing: ${product.name}`}
      />

      <EditProductForm product={product} />
    </div>
  );
}
