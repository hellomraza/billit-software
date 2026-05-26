"use client";

import { MoneyText } from "@/components/shared/money-text";
import { QuantityControl } from "@/components/shared/quantity-control";
import type { StockWarning } from "@/lib/utils/cross-tab-stock";
import { useBillingTabsStore } from "@/stores/billing-tabs-store";
import type { DiscountType, DraftItem } from "@/types/draft";
import { ShoppingCart, X } from "lucide-react";
import { useRef } from "react";
import { DiscountHoverCard } from "./discount-hover-card";

interface BillingCartProps {
  items: DraftItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  stockWarnings?: Map<string, StockWarning>;
  isReadOnly?: boolean;
}

export function BillingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  stockWarnings,
  isReadOnly = false,
}: BillingCartProps) {
  const activeTabId = useBillingTabsStore((s) => s.activeTabId);
  const setItemDiscount = useBillingTabsStore((s) => s.setItemDiscount);
  const clearItemDiscount = useBillingTabsStore((s) => s.clearItemDiscount);

  const inputRefs = useRef<
    Record<string, { timeout?: number; messageTimeout?: number }>
  >({});

  const clearPendingDiscountUpdate = (productId: string) => {
    const ref = inputRefs.current[productId];
    if (!ref) return;

    if (ref.timeout) {
      window.clearTimeout(ref.timeout);
      delete ref.timeout;
    }

    if (ref.messageTimeout) {
      window.clearTimeout(ref.messageTimeout);
      delete ref.messageTimeout;
    }
  };

  const commitItemDiscount = (
    productId: string,
    discountType: DiscountType,
    discountValue: number,
  ) => {
    clearPendingDiscountUpdate(productId);
    setItemDiscount(activeTabId, productId, discountType, discountValue);
  };

  const scheduleItemDiscount = (
    productId: string,
    discountType: DiscountType,
    discountValue: number,
  ) => {
    clearPendingDiscountUpdate(productId);
    const ref = (inputRefs.current[productId] =
      inputRefs.current[productId] || {});

    ref.timeout = window.setTimeout(() => {
      commitItemDiscount(productId, discountType, discountValue);
    }, 250) as unknown as number;
  };

  function ItemDiscountHoverCard({ item }: { item: DraftItem }) {
    const amountCap = item.unitPrice * item.quantity;

    return (
      <DiscountHoverCard
        title="Item discount"
        subjectLabel={item.productName}
        triggerLabel="Discount"
        currentType={item.itemDiscountType ?? "NONE"}
        currentValue={item.itemDiscountValue ?? 0}
        amountCap={amountCap}
        currentSummary={
          item.itemDiscountType && item.itemDiscountType !== "NONE"
            ? item.itemDiscountType === "PERCENTAGE"
              ? `−${item.itemDiscountValue}%`
              : `−₹${(item.itemDiscountValue ?? 0).toFixed(2)}`
            : null
        }
        isReadOnly={isReadOnly}
        onValueChange={(discountType, discountValue) => {
          scheduleItemDiscount(item.productId, discountType, discountValue);
        }}
        onValueCommit={(discountType, discountValue) => {
          commitItemDiscount(item.productId, discountType, discountValue);
        }}
        onRemove={() => {
          clearItemDiscount(activeTabId, item.productId);
          clearPendingDiscountUpdate(item.productId);
        }}
        footerNote="Applies to this line item only"
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground h-full min-h-75">
        <ShoppingCart className="h-12 w-12 opacity-20 mb-4" />
        <p>Scan or select products to add them to the bill.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 pb-0 gap-4 flex flex-col">
      {items.map((item, index) => (
        <div
          key={item.productId}
          className="flex gap-4 p-4 animate-in fade-in duration-300 transition-all bg-muted/50 hover:bg-muted/70 rounded-sm relative"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="font-medium text-sm leading-tight mb-2 pr-2">
              <div className="line-clamp-2">{item.productName}</div>
            </div>
            <div className="flex justify-between items-end">
              <MoneyText
                amount={item.unitPrice}
                className="text-muted-foreground text-xs"
              />
              <div className="flex items-center gap-3">
                <MoneyText
                  amount={item.quantity * item.unitPrice}
                  className="font-semibold text-sm"
                />
                {item.itemDiscountType && item.itemDiscountType !== "NONE" ? (
                  <span className="text-amber-600 text-xs font-medium">
                    {item.itemDiscountType === "PERCENTAGE"
                      ? `−${item.itemDiscountValue}%`
                      : `−₹${(item.itemDiscountValue ?? 0).toFixed(2)}`}
                  </span>
                ) : null}

                <ItemDiscountHoverCard item={item} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <QuantityControl
              quantity={item.quantity}
              onChange={(q) => {
                if (q <= 0) onRemoveItem(item.productId);
                else onUpdateQuantity(item.productId, q);
              }}
              min={0}
              disabled={isReadOnly}
            />
          </div>
          <button
            className={`p-1 text-muted-foreground hover:text-destructive transition-colors bg-muted aspect-square rounded-full absolute -top-2 -right-2 ${isReadOnly ? "opacity-60 pointer-events-none" : ""}`}
            onClick={() => onRemoveItem(item.productId)}
            title={isReadOnly ? "Editing paused while offline" : "Remove item"}
            aria-label={`Remove ${item.productName}`}
            disabled={isReadOnly}
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {items.map((item) => {
        const warning = stockWarnings?.get(item.productId);
        if (!warning) return null;
        return (
          <div
            key={`warning-${item.productId}`}
            className="px-4 text-amber-700 text-xs"
          >
            ⚠ Total across all bills: {warning.totalRequested} requested,{" "}
            {warning.availableStock} available across {warning.tabCount} bill
            {warning.tabCount > 1 ? "s" : ""}
          </div>
        );
      })}
    </div>
  );
}
