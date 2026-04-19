import { ProductsScreen } from "@/features/products/products-screen";
import { getOutletStock, getProducts } from "@/lib/api/products";
import { mergeStockIntoProducts } from "@/lib/utils/products";
import { cookies } from "next/headers";

export default async function ProductsPage(props: {
  searchParams: Promise<{ includeDeleted?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const outletId = cookieStore.get("outlet_id")?.value || "default-outlet";

  const includeDeleted = searchParams.includeDeleted === "true";

  // Fetch products and stock in parallel
  const [productsResponse, stockRecords] = await Promise.all([
    getProducts({ includeDeleted }),
    getOutletStock(outletId),
  ]);

  // Merge stock into products
  const productsWithStock = mergeStockIntoProducts(
    productsResponse.data,
    stockRecords.data,
  );

  return (
    <ProductsScreen
      products={productsWithStock}
      pagination={{
        page: productsResponse.page,
        limit: productsResponse.limit,
        total: productsResponse.total,
      }}
    />
  );
}
