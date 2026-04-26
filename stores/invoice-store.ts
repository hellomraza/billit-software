"use client";

import {
  submitInvoiceAction,
  submitInvoiceWithOverridesAction,
  type CreateInvoicePayload,
  type InsufficientStockDetail,
  type SubmitInvoiceResult,
} from "@/actions/invoices";
import {
  type Invoice,
  type InvoiceItem,
  type PaymentMethod,
} from "@/types/invoice";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

export type Phase =
  | "idle"
  | "submitting"
  | "stock_conflict"
  | "success"
  | "error";

export type CartItemInput = Omit<InvoiceItem, "subtotal" | "quantity">;

export interface InvoiceCreatedResponse {
  invoice: Invoice;
  abbreviationsLocked?: boolean;
}

type InvoiceStoreState = {
  cart: InvoiceItem[];
  searchQuery: string;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  isClearDialogOpen: boolean;
  isStockModalOpen: boolean;
  isPreviewMode: boolean;
  phase: Phase;
  insufficientItems: InsufficientStockDetail[];
  createdInvoice: InvoiceCreatedResponse | null;
  error: string;
  clientGeneratedId: string;
  actions: {
    setSearchQuery: (query: string) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setCustomerName: (name: string) => void;
    setCustomerPhone: (phone: string) => void;
    setCart: (items: InvoiceItem[]) => void;
    addCartItem: (item: CartItemInput, quantity?: number) => void;
    updateCartItemQuantity: (productId: string, quantity: number) => void;
    removeCartItem: (productId: string) => void;
    clearCart: () => void;
    openClearDialog: () => void;
    closeClearDialog: () => void;
    openStockModal: () => void;
    closeStockModal: () => void;
    enablePreviewMode: () => void;
    disablePreviewMode: () => void;
    togglePreviewMode: () => void;
    resetInvoiceDraft: () => void;
    submitInvoice: (
      gstEnabled: boolean,
      overrides?: Record<string, { quantity: number; override: boolean }>,
      clientDraftId?: string,
    ) => Promise<SubmitInvoiceResult>;
  };
};

const createDraftState = () => ({
  cart: [] as InvoiceItem[],
  searchQuery: "",
  paymentMethod: "CASH" as PaymentMethod,
  customerName: "",
  customerPhone: "",
  isClearDialogOpen: false,
  isStockModalOpen: false,
  phase: "idle" as Phase,
  insufficientItems: [] as InsufficientStockDetail[],
  createdInvoice: null as InvoiceCreatedResponse | null,
  error: "",
  clientGeneratedId: uuidv4(),
});

export const useInvoiceStore = create<InvoiceStoreState>((set, get) => ({
  ...createDraftState(),
  isPreviewMode: false,
  actions: {
    setSearchQuery: (query) => set({ searchQuery: query }),
    setPaymentMethod: (method) => set({ paymentMethod: method }),
    setCustomerName: (name) => set({ customerName: name }),
    setCustomerPhone: (phone) => set({ customerPhone: phone }),
    setCart: (items) => set({ cart: items }),
    addCartItem: (item, quantity = 1) =>
      set((state) => {
        const existing = state.cart.find(
          (cartItem) => cartItem.productId === item.productId,
        );

        if (existing) {
          const nextQuantity = existing.quantity + quantity;
          return {
            cart: state.cart.map((cartItem) =>
              cartItem.productId === item.productId
                ? {
                    ...cartItem,
                    quantity: nextQuantity,
                    subtotal: nextQuantity * cartItem.unitPrice,
                  }
                : cartItem,
            ),
          };
        }

        return {
          cart: [
            ...state.cart,
            {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            },
          ],
        };
      }),
    updateCartItemQuantity: (productId, quantity) =>
      set((state) => ({
        cart:
          quantity <= 0
            ? state.cart.filter((item) => item.productId !== productId)
            : state.cart.map((item) =>
                item.productId === productId
                  ? { ...item, quantity, subtotal: quantity * item.unitPrice }
                  : item,
              ),
      })),
    removeCartItem: (productId) =>
      set((state) => ({
        cart: state.cart.filter((item) => item.productId !== productId),
      })),
    clearCart: () => set({ cart: [] }),
    openClearDialog: () => set({ isClearDialogOpen: true }),
    closeClearDialog: () => set({ isClearDialogOpen: false }),
    openStockModal: () => set({ isStockModalOpen: true }),
    closeStockModal: () => set({ isStockModalOpen: false }),
    enablePreviewMode: () => set({ isPreviewMode: true }),
    disablePreviewMode: () => set({ isPreviewMode: false }),
    togglePreviewMode: () =>
      set((state) => ({ isPreviewMode: !state.isPreviewMode })),
    resetInvoiceDraft: () =>
      set({ ...createDraftState(), isPreviewMode: get().isPreviewMode }),
    submitInvoice: async (gstEnabled, overrides = {}, clientDraftId) => {
      const {
        cart,
        clientGeneratedId,
        customerName,
        customerPhone,
        paymentMethod,
      } = get();

      if (cart.length === 0) {
        const message = "Cart is empty";
        set({ phase: "error", error: message, createdInvoice: null });
        return { success: false, phase: "error", message };
      }

      set({
        phase: "submitting",
        error: "",
        insufficientItems: [],
        createdInvoice: null,
      });

      const payload: CreateInvoicePayload = {
        clientGeneratedId,
        ...(clientDraftId ? { clientDraftId } : {}),
        paymentMethod,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        gstEnabled,
        items: cart.map((item) => {
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
        const isRetry = Object.keys(overrides).length > 0;
        const result = isRetry
          ? await submitInvoiceWithOverridesAction(payload)
          : await submitInvoiceAction(payload);

        if (result.success && result.phase === "success") {
          const createdInvoice = {
            invoice: result.invoice!,
            abbreviationsLocked: false,
          } satisfies InvoiceCreatedResponse;

          set({
            phase: "success",
            createdInvoice,
            error: "",
            insufficientItems: [],
            isStockModalOpen: false,
          });

          return { success: true, phase: "success", invoice: result.invoice };
        }

        if (result.phase === "stock_conflict") {
          set({
            phase: "stock_conflict",
            insufficientItems: result.insufficientItems || [],
          });
          return {
            success: false,
            phase: "stock_conflict",
            insufficientItems: result.insufficientItems,
          };
        }

        const message = result.message || "Failed to create invoice";
        set({ phase: "error", error: message });
        return { success: false, phase: "error", message };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";

        set({ phase: "error", error: message });
        return { success: false, phase: "error", message };
      }
    },
  },
}));

export const useInvoiceCarts = () => useInvoiceStore((state) => state.cart);

export const useInvoicePhase = () => useInvoiceStore((state) => state.phase);

export const useInvoiceSearchQuery = () =>
  useInvoiceStore((state) => state.searchQuery);

export const useInvoiceCustomerDetails = () =>
  useInvoiceStore(
    useShallow((state) => ({
      customerName: state.customerName,
      customerPhone: state.customerPhone,
    })),
  );

export const useInvoiceSummary = (gstEnabled = true) =>
  useInvoiceStore(
    useShallow((state) => ({
      subtotal: state.cart.reduce((sum, item) => sum + item.subtotal, 0),
      gstAmount: state.cart.reduce(
        (sum, item) => sum + item.subtotal * (item.gstRate / 100),
        0,
      ),
      grandTotal: gstEnabled
        ? state.cart.reduce((sum, item) => sum + item.subtotal, 0) +
          state.cart.reduce(
            (sum, item) => sum + item.subtotal * (item.gstRate / 100),
            0,
          )
        : state.cart.reduce((sum, item) => sum + item.subtotal, 0),
    })),
  );

export const useOsPreviewMode = () =>
  useInvoiceStore((state) => state.isPreviewMode);

export const useInvoiceInsufficientItems = () =>
  useInvoiceStore((state) => state.insufficientItems);

export const useInvoicePaymentMethod = () =>
  useInvoiceStore((state) => state.paymentMethod);

export const useInvoiceActions = () =>
  useInvoiceStore((state) => state.actions);
