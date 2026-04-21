"use client";

import {
  InsufficientStockDetail,
  submitInvoiceAction,
  submitInvoiceWithOverridesAction,
  type CreateInvoicePayload,
} from "@/actions/invoices";
import { Invoice } from "@/types/invoice";
import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type Phase = "idle" | "submitting" | "stock_conflict" | "success" | "error";

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

export interface InvoiceCreatedResponse {
  invoice: Invoice;
  abbreviationsLocked?: boolean;
}

export function useInvoiceCreation() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [insufficientItems, setInsufficientItems] = useState<
    InsufficientStockDetail[]
  >([]);
  const [createdInvoice, setCreatedInvoice] =
    useState<InvoiceCreatedResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [clientGeneratedId] = useState(() => uuidv4());

  const submitInvoice = useCallback(
    async (
      cartItems: CartItem[],
      paymentMethod: string,
      customerName: string,
      customerPhone: string,
      gstEnabled: boolean,
      overrides: Record<string, { quantity: number; override: boolean }> = {},
    ) => {
      setPhase("submitting");
      setError("");
      setInsufficientItems([]);

      const payload: CreateInvoicePayload = {
        clientGeneratedId,
        paymentMethod: paymentMethod as "CASH" | "CARD" | "UPI",
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        gstEnabled,
        items: cartItems.map((item) => {
          const override = overrides[item.productId];
          return {
            productId: item.productId,
            quantity: override?.quantity ?? item.quantity,
            productName: item.productName,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            override: override?.override ?? false,
          };
        }),
      };

      try {
        // Determine if this is a retry with overrides
        const isRetry = Object.keys(overrides).length > 0;
        const result = isRetry
          ? await submitInvoiceWithOverridesAction(payload)
          : await submitInvoiceAction(payload);

        if (result.success && result.phase === "success") {
          setCreatedInvoice({
            invoice: result.invoice!,
            abbreviationsLocked: false,
          });
          setPhase("success");
          return { success: true, invoice: result.invoice };
        } else if (result.phase === "stock_conflict") {
          setPhase("stock_conflict");
          setInsufficientItems(result.insufficientItems || []);
          return { success: false, phase: "stock_conflict" };
        } else {
          setPhase("error");
          setError(result.message || "Failed to create invoice");
          return { success: false, phase: "error" };
        }
      } catch (err: unknown) {
        setPhase("error");
        const errorMessage =
          (err as Error).message || "An unexpected error occurred";
        setError(errorMessage);
        return { success: false, phase: "error" };
      }
    },
    [clientGeneratedId],
  );

  return {
    phase,
    insufficientItems,
    createdInvoice,
    error,
    submitInvoice,
  };
}
