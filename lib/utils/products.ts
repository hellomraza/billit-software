import { Product } from "@/lib/types/api";
import { StockResponse } from "../api/products";

export interface ProductWithStock extends Product {
  stock?: number;
}

/**
 * Merge stock records into product array
 * @param products Array of products
 * @param stockRecords Array of stock records from outlet
 * @returns Products with stock property populated
 */
export function mergeStockIntoProducts(
  products: Product[],
  stockRecords: StockResponse[],
): ProductWithStock[] {
  if (!stockRecords || stockRecords.length === 0) {
    // If no stock records, return products with stock = 0
    return products.map((product) => ({
      ...product,
      stock: 0,
    }));
  }
  // Create a map of productId -> quantity for quick lookup
  const stockMap = new Map<string, number>();
  stockRecords.forEach((record) => {
    stockMap.set(record.productId, record.quantity || 0);
  });

  // Merge stock into products
  return products.map((product) => ({
    ...product,
    stock: stockMap.get(product._id) ?? 0,
  }));
}
