"use server";

import { createServerAxios } from "@/lib/axios/server";
import { Invoice } from "@/types/invoice";
import { AxiosError } from "axios";
import { cookies } from "next/headers";

export interface CreateInvoicePayload {
  clientGeneratedId: string;
  paymentMethod: "CASH" | "CARD" | "UPI";
  customerName?: string;
  customerPhone?: string;
  gstEnabled: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    override?: boolean;
  }>;
}

export interface InvoiceCreatedResponse {
  data: Invoice;
  abbreviationsLocked?: boolean;
}

export interface InsufficientStockDetail {
  productId: string;
  productName: string;
  requestedQuantity: number;
  currentStock: number;
  deficitThreshold: number;
  currentDeficit: number;
  canOverride: boolean;
  overrideBlockReason?: string;
}

export interface SubmitInvoiceResult {
  success: boolean;
  phase: "success" | "stock_conflict" | "error";
  invoice?: Invoice;
  insufficientItems?: InsufficientStockDetail[];
  message?: string;
}

/**
 * Submit invoice - Phase 1
 * Returns 201/200 on success, or 409 with insufficientItems if stock conflict
 */
export async function submitInvoiceAction(
  payload: CreateInvoicePayload,
): Promise<SubmitInvoiceResult> {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant_id")?.value;
    const outletId = cookieStore.get("outlet_id")?.value;

    if (!tenantId) {
      return {
        success: false,
        phase: "error",
        message: "Tenant ID not found. Please log in again.",
      };
    }

    if (!outletId) {
      return {
        success: false,
        phase: "error",
        message: "Outlet ID not found. Please select an outlet.",
      };
    }

    const api = await createServerAxios();
    const { data } = await api.post<InvoiceCreatedResponse>(
      `/tenants/${tenantId}/invoices`,
      { ...payload, outletId },
    );

    return {
      success: true,
      phase: "success",
      invoice: data.data,
    };
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      // 409 - stock conflict
      if (err.response?.status === 409) {
        return {
          success: false,
          phase: "stock_conflict",
          insufficientItems: err.response.data.insufficientItems || [],
        };
      }

      // 403 - override blocked
      if (err.response?.status === 403) {
        return {
          success: false,
          phase: "error",
          message:
            err.response.data.message ||
            "Override blocked by deficit threshold",
        };
      }
    }

    if (err instanceof Error) {
      // Other errors
      return {
        success: false,
        phase: "error",
        message: err.message || "Failed to create invoice",
      };
    }

    return {
      success: false,
      phase: "error",
      message: "Failed to create invoice",
    };
  }
}

/**
 * Submit invoice with overrides - Phase 2
 * Same payload but with override flags set to true for selected items
 */
export async function submitInvoiceWithOverridesAction(
  payload: CreateInvoicePayload,
): Promise<SubmitInvoiceResult> {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("tenant_id")?.value;
    const outletId = cookieStore.get("outlet_id")?.value;

    if (!tenantId) {
      return {
        success: false,
        phase: "error",
        message: "Tenant ID not found. Please log in again.",
      };
    }

    if (!outletId) {
      return {
        success: false,
        phase: "error",
        message: "Outlet ID not found. Please select an outlet.",
      };
    }

    const api = await createServerAxios();
    const { data } = await api.post<InvoiceCreatedResponse>(
      `/tenants/${tenantId}/invoices`,
      { ...payload, outletId },
    );

    return {
      success: true,
      phase: "success",
      invoice: data.data,
    };
  } catch (err: unknown) {
    // 403 - override blocked
    if (err instanceof AxiosError) {
      if (err.response?.status === 403) {
        return {
          success: false,
          phase: "error",
          message:
            err.response.data.message ||
            "Override blocked by deficit threshold",
        };
      }

      // 409 - should not happen on retry, but handle it
      if (err.response?.status === 409) {
        return {
          success: false,
          phase: "stock_conflict",
          insufficientItems: err.response.data.insufficientItems || [],
        };
      }
    }
    if (err instanceof Error) {
      return {
        success: false,
        phase: "error",
        message: err.message,
      };
    }

    return {
      success: false,
      phase: "error",
      message: "Failed to create invoice",
    };
  }
}
