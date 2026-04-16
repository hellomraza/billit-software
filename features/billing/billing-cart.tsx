"use client";

import { MoneyText } from "@/components/shared/money-text";
import { QuantityControl } from "@/components/shared/quantity-control";
import { InvoiceItem } from "@/types";
import { ShoppingCart } from "lucide-react";

interface BillingCartProps {
  items: InvoiceItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function BillingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
}: BillingCartProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full min-h-[300px]">
        <ShoppingCart className="h-12 w-12 opacity-20 mb-4" />
        <p>Scan or select products to add them to the bill.</p>
      </div>
    );
  }

  return (
    <div className="divide-y h-full overflow-auto">
      {items.map((item, index) => (
        <div
          key={item.productId}
          className="p-4 flex gap-3 animate-in fade-in duration-300 transition-all hover:bg-muted/50"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex-1 flex flex-col justify-between">
            <div className="font-medium text-sm leading-tight mb-2 pr-4 relative">
              {item.productName}
              <button
                className="absolute -right-2 -top-2 p-1 text-muted-foreground hover:text-destructive transition-colors hidden sm:block"
                onClick={() => onRemoveItem(item.productId)}
                title="Remove item"
              >
                ×
              </button>
            </div>
            <MoneyText
              amount={item.unitPrice}
              className="text-muted-foreground text-xs"
            />
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <QuantityControl
              quantity={item.quantity}
              onChange={(q) => {
                if (q <= 0) onRemoveItem(item.productId);
                else onUpdateQuantity(item.productId, q);
              }}
              min={0}
            />
            <MoneyText
              amount={item.subtotal}
              className="font-semibold text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
