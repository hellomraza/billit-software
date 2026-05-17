"use server";

import { createServerAxios } from "@/lib/axios/server";
import { getTenantId } from "@/lib/get-tenant-id";
import { Invoice, InvoiceListItem, PaymentMethod } from "@/types/invoice";

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
  data: InvoiceListItem[];
  page: number;
  limit: number;
  total: number;
}

export type InvoiceListResponse = {
  invoiceNumber: string;
  invoiceId: string;
  createdAt: string;
  businessName: string;
  gstEnabled: boolean;
  itemCount: number;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  deficitCount: number;
};

interface ApiPaginatedResponse {
  data: InvoiceListResponse[];
  page: number;
  limit: number;
  total: number;
}

function transformInvoice(apiInvoice: InvoiceListResponse): InvoiceListItem {
  return {
    id: apiInvoice.invoiceId,
    invoiceNumber: apiInvoice.invoiceNumber,
    createdAt: apiInvoice.createdAt,
    customerName: apiInvoice.customerName,
    isGstInvoice: apiInvoice.gstEnabled,
    paymentMethod: apiInvoice.paymentMethod,
    subtotal: apiInvoice.subtotal,
    totalGst: apiInvoice.gstTotal,
    grandTotal: apiInvoice.grandTotal,
  };
}

function transformInvoiceDetail(apiInvoice: GetInvoiceResponse): Invoice {
  return {
    id: apiInvoice.invoiceId,
    invoiceNumber: apiInvoice.invoiceNumber,
    createdAt: apiInvoice.createdAt,
    customerName: apiInvoice.customerDetails?.name,
    customerPhone: apiInvoice.customerDetails?.phone,
    isGstInvoice: apiInvoice.gstEnabled,
    paymentMethod: apiInvoice.paymentMethod,
    items: apiInvoice.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      gstRate: item.gstRate,
      gstAmount: item.gstAmount,
      subtotal: item.lineTotal,
    })),
    subtotal: apiInvoice.subtotal,
    totalGst: apiInvoice.gstTotal,
    grandTotal: apiInvoice.grandTotal,
  };
}

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

type InvoiceItemResponseDto = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
};

type GetInvoiceResponse = {
  invoiceNumber: string;
  invoiceId: string;
  createdAt: string;
  businessName: string;
  businessAbbr: string;
  outletName: string;
  outletAbbr: string;
  gstEnabled: boolean;
  tenantGSTNumber?: string;
  customerDetails?: {
    name: string;
    phone: string;
  };
  paymentMethod: PaymentMethod;
  items: InvoiceItemResponseDto[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  deficitItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    currentResolutionStatus: "PENDING" | "RESOLVED";
  }>;
};
export async function getInvoice(invoiceId: string): Promise<Invoice> {
  try {
    const tenantId = await getTenantId();
    const api = await createServerAxios();

    const { data } = await api.get<GetInvoiceResponse>(
      `/tenants/${tenantId}/invoices/${invoiceId}`,
    );

    return transformInvoiceDetail(data);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    throw error;
  }
}
