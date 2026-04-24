"use client";

import { indexedDBStorage } from "@/lib/indexedDbStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";

export type BillingDraftItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
};

type BillingState = {
  items: BillingDraftItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: "CASH" | "CARD" | "UPI" | "";
  hasHydrated: boolean;
  actions: {
    setHasHydrated: (value: boolean) => void;
    setItems: (items: BillingDraftItem[]) => void;
    setCustomerName: (value: string) => void;
    setCustomerPhone: (value: string) => void;
    setPaymentMethod: (value: BillingState["paymentMethod"]) => void;
    addItem: (item: BillingDraftItem) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearBill: () => void;
  };
};

const initialDraftState = {
  items: [] as BillingDraftItem[],
  customerName: "",
  customerPhone: "",
  paymentMethod: "CASH" as BillingState["paymentMethod"],
};

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      ...initialDraftState,
      hasHydrated: false,
      actions: {
        setHasHydrated: (value) => set({ hasHydrated: value }),
        setItems: (items) => set({ items }),
        setCustomerName: (value) => set({ customerName: value }),
        setCustomerPhone: (value) => set({ customerPhone: value }),
        setPaymentMethod: (value) => set({ paymentMethod: value }),

        // Initial setup only; Section G logic can be expanded incrementally.
        addItem: (item) =>
          set((state) => {
            const existing = state.items.find(
              (i) => i.productId === item.productId,
            );

            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.productId === item.productId
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i,
                ),
              };
            }

            return { items: [...state.items, item] };
          }),

        updateQuantity: (productId, quantity) =>
          set((state) => ({
            items:
              quantity <= 0
                ? state.items.filter((i) => i.productId !== productId)
                : state.items.map((i) =>
                    i.productId === productId ? { ...i, quantity } : i,
                  ),
          })),

        removeItem: (productId) =>
          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          })),

        clearBill: () =>
          set({
            ...initialDraftState,
          }),
      },
    }),
    {
      name: "billing-draft",
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        items: state.items,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        paymentMethod: state.paymentMethod,
      }),
      onRehydrateStorage: () => (state) => {
        state?.actions.setHasHydrated(true);
      },
    },
  ),
);

export const useBillingItems = () => useBillingStore((state) => state.items);
export const useBillingHydrated = () =>
  useBillingStore((state) => state.hasHydrated);
export const useBillingCustomerDetails = () =>
  useBillingStore(
    useShallow((state) => ({
      customerName: state.customerName,
      customerPhone: state.customerPhone,
    })),
  );
export const useBillingPaymentMethod = () =>
  useBillingStore((state) => state.paymentMethod);
export const useBillingActions = () =>
  useBillingStore((state) => state.actions);
