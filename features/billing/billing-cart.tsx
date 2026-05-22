"use client";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
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

type HoverCardTab = "PERCENTAGE" | "FLAT";

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

  const [clampMessages, setClampMessages] = useState<Record<string, string>>(
    {},
  );

  const clearClampMessage = (productId: string) => {
    setClampMessages((state) => {
      if (!state[productId]) return state;
      const next = { ...state };
      delete next[productId];
      return next;
    });
  };

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

  const showClampMessage = (productId: string, message: string) => {
    setClampMessages((state) => ({ ...state, [productId]: message }));

    const ref = (inputRefs.current[productId] =
      inputRefs.current[productId] || {});

    if (ref.messageTimeout) {
      window.clearTimeout(ref.messageTimeout);
    }

    ref.messageTimeout = window.setTimeout(() => {
      setClampMessages((state) => {
        const next = { ...state };
        delete next[productId];
        return next;
      });
      delete ref.messageTimeout;
    }, 3000) as unknown as number;
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
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<HoverCardTab>("PERCENTAGE");
    const [percentageValue, setPercentageValue] = useState(0);
    const [amountValue, setAmountValue] = useState(0);

    const resetValues = () => {
      const currentType = item.itemDiscountType ?? "NONE";
      setActiveTab("PERCENTAGE");
      setPercentageValue(
        currentType === "PERCENTAGE" ? (item.itemDiscountValue ?? 0) : 0,
      );
      setAmountValue(currentType === "FLAT" ? (item.itemDiscountValue ?? 0) : 0);
      clearClampMessage(item.productId);
      clearPendingDiscountUpdate(item.productId);
    };

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        resetValues();
      }
    };

    const percentCap = 100;
    const amountCap = item.unitPrice * item.quantity;

    return (
      <HoverCard open={open} onOpenChange={handleOpenChange}>
        <HoverCardTrigger
          render={(props, state) => (
            <button
              type="button"
              {...props}
              className={`text-muted-foreground hover:text-primary text-xs px-2 py-1 rounded transition-colors ${state.open ? "text-primary bg-primary/10" : ""}`}
              disabled={isReadOnly}
            >
              Discount
            </button>
          )}
        />

        <HoverCardContent side="bottom" align="end" className="w-80 p-0">
          <div className="rounded-lg border bg-background p-3 shadow-lg">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Item discount</div>
                <div className="line-clamp-1 text-xs text-muted-foreground">
                  {item.productName}
                </div>
              </div>
              {item.itemDiscountType && item.itemDiscountType !== "NONE" ? (
                <span className="text-xs font-medium text-amber-600">
                  {item.itemDiscountType === "PERCENTAGE"
                    ? `−${item.itemDiscountValue}%`
                    : `−₹${(item.itemDiscountValue ?? 0).toFixed(2)}`}
                </span>
              ) : null}
            </div>

            <div
              role="tablist"
              aria-label="Discount type"
              className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "PERCENTAGE"}
                onClick={() => {
                  setActiveTab("PERCENTAGE");
                  setPercentageValue(
                    (item.itemDiscountType ?? "NONE") === "PERCENTAGE"
                      ? (item.itemDiscountValue ?? 0)
                      : 0,
                  );
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "PERCENTAGE" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                disabled={isReadOnly}
              >
                Percentage
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "FLAT"}
                onClick={() => {
                  setActiveTab("FLAT");
                  setAmountValue(
                    (item.itemDiscountType ?? "NONE") === "FLAT"
                      ? (item.itemDiscountValue ?? 0)
                      : 0,
                  );
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "FLAT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                disabled={isReadOnly}
              >
                Amount
              </button>
            </div>

            {activeTab === "PERCENTAGE" ? (
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Discount percentage
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={percentCap}
                    step="0.01"
                    value={percentageValue}
                    onChange={(e) => {
                      const value = Number(e.target.value || 0);
                      const next = Math.max(0, value);
                      setPercentageValue(next);
                      clearClampMessage(item.productId);
                      scheduleItemDiscount(item.productId, "PERCENTAGE", next);
                    }}
                    onBlur={() => {
                      const clamped = Math.min(
                        Math.max(0, percentageValue),
                        percentCap,
                      );
                      setPercentageValue(clamped);
                      commitItemDiscount(item.productId, "PERCENTAGE", clamped);
                      if (clamped < percentageValue) {
                        showClampMessage(item.productId, "Discount capped at 100%.");
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Quick picks
                  </div>
                  <div className="flex gap-2">
                    {[5, 10, 15].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setPercentageValue(preset);
                          commitItemDiscount(item.productId, "PERCENTAGE", preset);
                        }}
                        disabled={isReadOnly}
                      >
                        {preset}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Discount amount
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={amountCap}
                    step="0.01"
                    value={amountValue}
                    onChange={(e) => {
                      const value = Number(e.target.value || 0);
                      const next = Math.max(0, value);
                      setAmountValue(next);
                      clearClampMessage(item.productId);
                      scheduleItemDiscount(item.productId, "FLAT", next);
                    }}
                    onBlur={() => {
                      const clamped = Math.min(
                        Math.max(0, amountValue),
                        amountCap,
                      );
                      setAmountValue(clamped);
                      commitItemDiscount(item.productId, "FLAT", clamped);
                      if (clamped < amountValue) {
                        showClampMessage(
                          item.productId,
                          "Discount capped at item total.",
                        );
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            )}

            {clampMessages[item.productId] ? (
              <div className="mt-2 text-xs text-amber-700">
                {clampMessages[item.productId]}
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  clearItemDiscount(activeTabId, item.productId);
                  clearPendingDiscountUpdate(item.productId);
                  clearClampMessage(item.productId);
                  setPercentageValue(0);
                  setAmountValue(0);
                }}
                disabled={isReadOnly}
                className="text-rose-600 hover:text-rose-700"
              >
                Remove discount
              </Button>

              <div className="text-xs text-muted-foreground">
                Applies to this line item only
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
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
            ⚠ Total across all bills: {warning.totalRequested} requested, {" "}
            {warning.availableStock} available across {warning.tabCount} bill
            {warning.tabCount > 1 ? "s" : ""}
          </div>
        );
      })}
    </div>
  );
}
