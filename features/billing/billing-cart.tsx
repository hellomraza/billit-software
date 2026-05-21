"use client";

import { MoneyText } from "@/components/shared/money-text";
import { QuantityControl } from "@/components/shared/quantity-control";
import type { StockWarning } from "@/lib/utils/cross-tab-stock";
import { useBillingTabsStore } from "@/stores/billing-tabs-store";
import type { DiscountType, DraftItem } from "@/types/draft";
import { ShoppingCart, X } from "lucide-react";
import { useRef, useState } from "react";

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

  const [expandedDiscountItemId, setExpandedDiscountItemId] = useState<
    string | null
  >(null);

  // Local input state refs for debouncing per item
  const inputRefs = useRef<Record<string, { timeout?: number; messageTimeout?: number }>>({});

  const [clampMessages, setClampMessages] = useState<Record<string, string>>({});
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
                {/* Active discount indicator */}
                {item.itemDiscountType && item.itemDiscountType !== "NONE" ? (
                  <span className="text-amber-600 text-xs font-medium">
                    {item.itemDiscountType === "PERCENTAGE"
                      ? `−${item.itemDiscountValue}%`
                      : `−₹${(item.itemDiscountValue ?? 0).toFixed(2)}`}
                  </span>
                ) : null}
                {/* Discount toggle button */}
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary text-xs px-2 py-1 rounded"
                  onClick={() =>
                    setExpandedDiscountItemId((prev) =>
                      prev === item.productId ? null : item.productId,
                    )
                  }
                >
                  Discount
                </button>
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
      {/* Expanded discount panels */}
      {items.map((item) => {
        const open = expandedDiscountItemId === item.productId;
        return (
          <div key={`discount-${item.productId}`}>
            {open ? (
              <div className="p-3 bg-muted/40 rounded-sm mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-medium">Type</label>
                  <div className="flex gap-2">
                    <button
                      className={`px-2 py-1 rounded ${
                        (item.itemDiscountType ?? "NONE") === "PERCENTAGE"
                          ? "bg-primary text-white"
                          : "bg-transparent"
                      }`}
                      onClick={() =>
                        setItemDiscount(
                          activeTabId,
                          item.productId,
                          "PERCENTAGE" as DiscountType,
                          0,
                        )
                      }
                      disabled={isReadOnly}
                    >
                      %
                    </button>
                    <button
                      className={`px-2 py-1 rounded ${
                        (item.itemDiscountType ?? "NONE") === "FLAT"
                          ? "bg-primary text-white"
                          : "bg-transparent"
                      }`}
                      onClick={() =>
                        setItemDiscount(
                          activeTabId,
                          item.productId,
                          "FLAT" as DiscountType,
                          0,
                        )
                      }
                      disabled={isReadOnly}
                    >
                      ₹
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="text-sm font-medium mb-1 block">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={item.itemDiscountValue ?? 0}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      // clear any clamp message while typing
                      setClampMessages((s) => {
                        if (!s[item.productId]) return s;
                        const copy = { ...s };
                        delete copy[item.productId];
                        return copy;
                      });
                      // debounce updates to store
                      const ref = (inputRefs.current[item.productId] =
                        inputRefs.current[item.productId] || {});
                      if (ref.timeout) window.clearTimeout(ref.timeout);
                      if (ref.messageTimeout) {
                        window.clearTimeout(ref.messageTimeout);
                        delete ref.messageTimeout;
                      }
                      ref.timeout = window.setTimeout(() => {
                        const dtype = (item.itemDiscountType ?? "NONE") as DiscountType;
                        setItemDiscount(activeTabId, item.productId, dtype, Math.max(0, v));
                      }, 300) as unknown as number;
                    }}
                    onBlur={(e) => {
                      // clamping on blur
                      const v = Number(e.currentTarget.value || 0);
                      if ((item.itemDiscountType ?? "NONE") === "FLAT") {
                        const cap = item.unitPrice * item.quantity;
                        const clamped = Math.min(Math.max(0, v), cap);
                        setItemDiscount(activeTabId, item.productId, "FLAT", clamped);
                        if (clamped < v) {
                          setClampMessages((s) => ({ ...s, [item.productId]: "Discount capped at item total." }));
                          const ref = (inputRefs.current[item.productId] = inputRefs.current[item.productId] || {});
                          if (ref.messageTimeout) window.clearTimeout(ref.messageTimeout);
                          ref.messageTimeout = window.setTimeout(() => {
                            setClampMessages((s) => {
                              const copy = { ...s };
                              delete copy[item.productId];
                              return copy;
                            });
                            delete ref.messageTimeout;
                          }, 3000) as unknown as number;
                        }
                      } else if ((item.itemDiscountType ?? "NONE") === "PERCENTAGE") {
                        const clamped = Math.min(Math.max(0, v), 100);
                        setItemDiscount(activeTabId, item.productId, "PERCENTAGE", clamped);
                        if (clamped < v) {
                          setClampMessages((s) => ({ ...s, [item.productId]: "Discount capped at 100%." }));
                          const ref = (inputRefs.current[item.productId] = inputRefs.current[item.productId] || {});
                          if (ref.messageTimeout) window.clearTimeout(ref.messageTimeout);
                          ref.messageTimeout = window.setTimeout(() => {
                            setClampMessages((s) => {
                              const copy = { ...s };
                              delete copy[item.productId];
                              return copy;
                            });
                            delete ref.messageTimeout;
                          }, 3000) as unknown as number;
                        }
                      }
                    }}
                    disabled={isReadOnly}
                    className="border rounded px-2 py-1 w-32"
                  />
                </div>
                {clampMessages[item.productId] ? (
                  <div className="text-xs text-amber-700 mt-1">
                    {clampMessages[item.productId]}
                  </div>
                ) : null}
                <div>
                  <button
                    className="text-sm text-rose-600"
                    onClick={() => {
                      clearItemDiscount(activeTabId, item.productId);
                      setExpandedDiscountItemId(null);
                    }}
                    disabled={isReadOnly}
                  >
                    Remove discount
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
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
