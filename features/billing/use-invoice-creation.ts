"use client";

import {
  type CartItemInput,
  type InvoiceCreatedResponse,
  type Phase,
  useInvoiceStore,
} from "../../stores/invoice-store";

export type CartItem = CartItemInput;

export function useInvoiceCreation() {
  const state = useInvoiceStore();

  return {
    phase: state.phase as Phase,
    insufficientItems: state.insufficientItems,
    createdInvoice: state.createdInvoice as InvoiceCreatedResponse | null,
    error: state.error,
    submitInvoice: state.actions.submitInvoice,
  };
}
