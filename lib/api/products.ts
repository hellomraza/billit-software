"use server";

import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { PaginatedResponse, Product } from "@/lib/types/api";

export interface ProductFilters {
  page?: number;
  limit?: number;
  showDeleted?: boolean;
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<PaginatedResponse<Product>> {
  const tenantId = await getTenantId();
  const api = await createServerAxios();

  const { page = 1, limit = 50, showDeleted = false } = filters;

  const { data } = await api.get(`/tenants/${tenantId}/products`, {
    params: {
      page,
      limit,
      showDeleted,
    },
  });

  return data;
}

export async function getOutletStock(
  outletId: string,
): Promise<PaginatedResponse<any[]>> {
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
