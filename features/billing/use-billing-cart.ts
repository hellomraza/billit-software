"use client";

import {
  BillingDraftItem,
  useBillingActions,
  useBillingHydrated,
  useBillingItems,
} from "@/stores/billing-store";

export function useBillingCart() {
  const items = useBillingItems();
  const hasHydrated = useBillingHydrated();
  const actions = useBillingActions();

  return {
    items,
    hasHydrated,
    addItem: (item: BillingDraftItem) => actions.addItem(item),
    removeItem: (productId: string) => actions.removeItem(productId),
    updateQuantity: (productId: string, quantity: number) =>
      actions.updateQuantity(productId, quantity),
    setItems: (nextItems: BillingDraftItem[]) => actions.setItems(nextItems),
    clearCart: () => actions.clearBill(),
  };
}
