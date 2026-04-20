"use server";

import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { Invoice as ApiInvoice } from "@/lib/types/api";
import { Invoice } from "@/types/invoice";

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  invoiceNumber?: string;
  paymentMethod?: "CASH" | "CARD" | "UPI";
  gstEnabled?: boolean;
  outletId?: string;
  productId?: string;
}

export interface PaginatedInvoices {
  data: Invoice[];
  page: number;
  limit: number;
  total: number;
}

interface ApiPaginatedResponse {
  data: ApiInvoice[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Transform API invoice to local Invoice type
 */
function transformInvoice(apiInvoice: ApiInvoice): Invoice {
  return {
    id: apiInvoice._id,
    invoiceNumber: apiInvoice.invoiceNumber,
    createdAt: apiInvoice.createdAt,
    customerName: apiInvoice.customerName,
    customerPhone: apiInvoice.customerPhone,
    isGstInvoice: apiInvoice.isGstInvoice,
    paymentMethod: apiInvoice.paymentMethod,
    items: apiInvoice.items as any,
    subtotal: apiInvoice.subtotal,
    totalGst: apiInvoice.totalGstAmount,
    grandTotal: apiInvoice.grandTotal,
  };
}

/**
 * Fetch invoices for a tenant with optional filters
 * Returns paginated list of invoices with filter support
 */
export async function getInvoices(
  filters: InvoiceFilters = {},
): Promise<PaginatedInvoices> {
  try {
    const tenantId = await getTenantId();
    const api = await createServerAxios();

    const { data } = await api.get<ApiPaginatedResponse>(
      `/tenants/${tenantId}/invoices`,
      {
        params: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
          ...(filters.dateTo && { dateTo: filters.dateTo }),
          ...(filters.invoiceNumber && {
            invoiceNumber: filters.invoiceNumber,
          }),
          ...(filters.paymentMethod && {
            paymentMethod: filters.paymentMethod,
          }),
          ...(filters.gstEnabled !== undefined && {
            gstEnabled: filters.gstEnabled,
          }),
          ...(filters.outletId && { outletId: filters.outletId }),
          ...(filters.productId && { productId: filters.productId }),
        },
      },
    );

    return {
      data: data.data.map(transformInvoice),
      page: data.page,
      limit: data.limit,
      total: data.total,
    };
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    throw error;
  }
}

/**
 * Fetch a single invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<Invoice> {
  try {
    const tenantId = await getTenantId();
    const api = await createServerAxios();

    const { data } = await api.get<ApiInvoice>(
      `/tenants/${tenantId}/invoices/${invoiceId}`,
    );

    return transformInvoice(data);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    throw error;
  }
}
