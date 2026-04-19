"use server";

import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";

/**
 * API contract for stock operations
 * Two-step process:
 * 1. POST /tenants/{tenantId}/stock - CREATE initial stock (new products)
 * 2. PATCH /tenants/{tenantId}/products/{productId}/stock - UPDATE stock (existing)
 */

export interface CreateStockRequest {
  productId: string;
  outletId: string;
  quantity: number;
}

export interface StockResponse {
  _id: string;
  tenantId: string;
  productId: string;
  outletId: string;
  quantity: number;
}

/**
 * Create a new stock record for a product at an outlet
 * MUST be called after product creation to initialize stock
 * Used for new products that don't have a stock record yet
 */
export async function createStock(
  productId: string,
  outletId: string,
  quantity: number = 0,
): Promise<StockResponse> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();

  const { data } = await api.post<{ data: StockResponse }>(
    `/tenants/${tenantId}/stock`,
    {
      productId,
      outletId,
      quantity,
    },
  );

  return data.data;
}

/**
 * Update stock quantity for an existing product at an outlet
 * Stock record MUST already exist (created via createStock)
 * Used for subsequent stock updates
 */
export async function updateStock(
  productId: string,
  outletId: string,
  quantity: number,
): Promise<StockResponse> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();

  const { data } = await api.patch<{ data: StockResponse }>(
    `/tenants/${tenantId}/products/${productId}/stock`,
    { quantity },
    { params: { outletId } },
  );

  return data.data;
}

/**
 * Get stock record for a product at a specific outlet
 */
export async function getStockByProductAndOutlet(
  productId: string,
  outletId: string,
): Promise<StockResponse | null> {
  try {
    const tenantId = await getTenantId();
    const api = await createServerAxios();

    const { data } = await api.get<{ data: StockResponse }>(
      `/tenants/${tenantId}/stock/product/${productId}/outlet/${outletId}`,
    );

    return data.data;
  } catch (error) {
    console.error("Failed to get stock:", error);
    return null;
  }
}

/**
 * Get all stock records for an outlet
 */
export async function getOutletAllStock(
  outletId: string,
): Promise<StockResponse[]> {
  try {
    const tenantId = await getTenantId();
    const api = await createServerAxios();

    const { data } = await api.get<{ data: StockResponse[] }>(
      `/tenants/${tenantId}/stock/outlet/${outletId}`,
    );

    return data.data || [];
  } catch (error) {
    console.error("Failed to get outlet stock:", error);
    return [];
  }
}
