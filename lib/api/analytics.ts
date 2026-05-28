"use server";

import { createServerAxios } from "@/lib/axios/server";

export async function getLowStockProducts(tenantId: string) {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/low-stock`);
  return data;
}

export async function getDeficitSummary(tenantId: string) {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/deficit-summary`);
  return data;
}

export async function getProductHealth(tenantId: string, window: 7 | 30 | 90) {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/product-health`, {
    params: { window },
  });
  return data;
}
