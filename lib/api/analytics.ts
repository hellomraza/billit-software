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

export async function getRevenueSummary(tenantId: string, period: string, dateFrom?: string, dateTo?: string) {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/revenue-summary`, {
    params: { period, dateFrom, dateTo }
  });
  return data;
}

export async function getRevenueChart(tenantId: string, period: string, dateFrom?: string, dateTo?: string) {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/revenue-chart`, {
    params: { period, dateFrom, dateTo }
  });
  return data;
}

export async function getTopProducts(tenantId: string, period: string, dateFrom?: string, dateTo?: string, sortBy?: "revenue" | "units_sold") {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/top-products`, {
    params: { period, dateFrom, dateTo, sortBy }
  });
  return data;
}

export async function getPaymentBreakdown(tenantId: string, period: string, dateFrom?: string, dateTo?: string) {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/payment-breakdown`, {
    params: { period, dateFrom, dateTo }
  });
  return data;
}

export async function getGstSummary(tenantId: string, period: string, dateFrom?: string, dateTo?: string) {
  const api = await createServerAxios();
  const { data } = await api.get(`/tenants/${tenantId}/analytics/gst-summary`, {
    params: { period, dateFrom, dateTo }
  });
  return data;
}
