"use client";

import { MoneyText } from "@/components/shared/money-text";
import { QuantityControl } from "@/components/shared/quantity-control";
import type { StockWarning } from "@/lib/utils/cross-tab-stock";
import type { DraftItem } from "@/types/draft";
import { ShoppingCart, X } from "lucide-react";

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
              <MoneyText
                amount={item.quantity * item.unitPrice}
                className="font-semibold text-sm"
              />
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
