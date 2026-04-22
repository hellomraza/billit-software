"use server";

import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { PaginatedResponse, Product, ProductWithStock } from "@/lib/types/api";

export interface ProductFilters {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<PaginatedResponse<ProductWithStock>> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();

  const { page = 1, limit = 50, includeDeleted = false } = filters;

  const { data } = await api.get(`/tenants/${tenantId}/products`, {
    params: {
      page,
      limit,
      includeDeleted,
    },
  });

  return data;
}

export type StockResponse = {
  _id: string;
  tenantId: string;
  productId: string;
  outletId: string;
  quantity: number;
  updatedAt: Date;
};

export async function getOutletStock(
  outletId: string,
): Promise<PaginatedResponse<StockResponse>> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();

  const { data } = await api.get(
    `/tenants/${tenantId}/stock/outlet/${outletId}`,
  );
  return data;
}

export async function getProduct(productId: string): Promise<Product> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();

  const { data } = await api.get(`/tenants/${tenantId}/products/${productId}`);

  return data;
}
