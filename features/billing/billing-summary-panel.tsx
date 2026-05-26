"use client";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { MoneyText } from "@/components/shared/money-text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_METHODS } from "@/lib/constants/defaults";
import { calculateDiscounts } from "@/lib/utils/discount-calculator";
import { useBillingTabsStore } from "@/stores/billing-tabs-store";
import { useIsGstEnabled } from "@/stores/get-store";
import { useInvoiceActions, useInvoicePhase } from "@/stores/invoice-store";
import { type PaymentMethod } from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DiscountHoverCard } from "./discount-hover-card";

interface BillingSummaryPanelProps {
  onFinalize: () => void;
  isEnabled: boolean;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  isReadOnly?: boolean;
}

export function BillingSummaryPanel({
  onFinalize,
  isEnabled,
  subtotal,
  gstAmount,
  grandTotal,
  paymentMethod,
  onPaymentMethodChange,
  isReadOnly = false,
}: BillingSummaryPanelProps) {
  const phase = useInvoicePhase();
  const isFinalizing = phase === "submitting";
  const gstEnabled = useIsGstEnabled();
  const paymentButtonsRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  const { openClearDialog } = useInvoiceActions();

  const activeDraft = useBillingTabsStore((s) =>
    s.drafts.find((d) => d.clientDraftId === s.activeTabId),
  );
  const setBillDiscount = useBillingTabsStore((s) => s.setBillDiscount);
  const clearBillDiscount = useBillingTabsStore((s) => s.clearBillDiscount);

  const [confirmZeroOpen, setConfirmZeroOpen] = useState(false);
  const [billDiscountOpen, setBillDiscountOpen] = useState(false);
  const pendingBillDiscountRef = useRef<{
    type: "PERCENTAGE" | "FLAT";
    value: number;
  } | null>(null);
  const billDebounceRef = useRef<number | null>(null);

  const activeBillDiscountType = (activeDraft?.billDiscountType ?? "NONE") as
    | "NONE"
    | "PERCENTAGE"
    | "FLAT";
  const activeBillDiscountValue = activeDraft?.billDiscountValue ?? 0;

  const activeBillDiscountLabel = useMemo(() => {
    if (activeBillDiscountType === "NONE" || activeBillDiscountValue <= 0) {
      return null;
    }

    return activeBillDiscountType === "PERCENTAGE"
      ? `−${activeBillDiscountValue.toFixed(0)}%`
      : `−₹${activeBillDiscountValue.toFixed(2)}`;
  }, [activeBillDiscountType, activeBillDiscountValue]);

  const billDiscountIsActive = activeBillDiscountType !== "NONE";

  const itemsForCalc = useMemo(
    () =>
      (activeDraft?.items ?? []).map((it) => ({
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        gstRate: it.gstRate,
        itemDiscountType: (it.itemDiscountType ?? "NONE") as any,
        itemDiscountValue: it.itemDiscountValue ?? 0,
      })),
    [activeDraft?.items],
  );

  const preDiscountGrandTotal = useMemo(
    () =>
      (activeDraft?.items ?? []).reduce(
        (sum, item) =>
          sum + item.unitPrice * item.quantity * (1 + item.gstRate / 100),
        0,
      ),
    [activeDraft?.items],
  );

  const calcResult = useMemo(
    () =>
      calculateDiscounts(
        itemsForCalc,
        activeBillDiscountType,
        activeBillDiscountValue,
        gstEnabled,
      ),
    [activeBillDiscountType, activeBillDiscountValue, gstEnabled, itemsForCalc],
  );

  const itemDiscountTotal = useMemo(
    () =>
      calcResult.items.reduce((sum, item) => sum + item.itemDiscountAmount, 0),
    [calcResult.items],
  );

  const subtotalBeforeItemDiscounts = subtotal + itemDiscountTotal;
  const showItemDiscounts = itemDiscountTotal > 0;
  const showGstLine = gstEnabled && Math.abs(gstAmount) > 0;
  const showBillDiscountLine = calcResult.billDiscountAmount > 0;
  const billDiscountSummaryLabel =
    activeBillDiscountType === "PERCENTAGE"
      ? `Bill discount (${activeBillDiscountValue.toFixed(0)}%)`
      : "Bill discount";

  const announceAction = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  const clearPendingBillDiscount = () => {
    pendingBillDiscountRef.current = null;
    if (billDebounceRef.current) {
      window.clearTimeout(billDebounceRef.current);
      billDebounceRef.current = null;
    }
  };

  const normalizeBillDiscountValue = (
    discountType: "PERCENTAGE" | "FLAT",
    rawValue: number,
  ) => {
    const normalizedValue = Math.max(0, rawValue);

    if (discountType === "PERCENTAGE") {
      return Math.round(Math.min(100, normalizedValue) * 100) / 100;
    }

    return (
      Math.round(Math.min(preDiscountGrandTotal, normalizedValue) * 100) / 100
    );
  };

  const commitBillDiscount = (
    discountType: "NONE" | "PERCENTAGE" | "FLAT",
    rawValue: number,
    immediate = false,
  ) => {
    if (!activeDraft?.clientDraftId) {
      return;
    }

    const normalizedValue =
      discountType === "NONE"
        ? 0
        : normalizeBillDiscountValue(discountType, rawValue);
    const wouldZeroGrandTotal =
      discountType !== "NONE" &&
      calculateDiscounts(
        itemsForCalc,
        discountType,
        normalizedValue,
        gstEnabled,
      ).grandTotal === 0;
    const isSameAsActive =
      activeBillDiscountType === discountType &&
      activeBillDiscountValue === normalizedValue;

    const apply = () => {
      if (discountType !== "NONE" && wouldZeroGrandTotal && !isSameAsActive) {
        pendingBillDiscountRef.current = {
          type: discountType,
          value: normalizedValue,
        };
        setConfirmZeroOpen(true);
        return;
      }

      clearPendingBillDiscount();
      setBillDiscount(activeDraft.clientDraftId, discountType, normalizedValue);
    };

    if (billDebounceRef.current) {
      window.clearTimeout(billDebounceRef.current);
      billDebounceRef.current = null;
    }

    if (immediate) {
      apply();
      return;
    }

    billDebounceRef.current = window.setTimeout(
      apply,
      300,
    ) as unknown as number;
  };

  const handleBillDiscountRemove = () => {
    clearPendingBillDiscount();
    clearBillDiscount(activeDraft?.clientDraftId ?? "");
    setBillDiscountOpen(false);
  };

  const openBillDiscountEditor = () => {
    setBillDiscountOpen(true);
  };

  useEffect(() => {
    return () => {
      if (billDebounceRef.current) {
        window.clearTimeout(billDebounceRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t bg-muted/30 shrink-0">
      <div className="p-4 space-y-3 text-sm">
        <div>
          {billDiscountIsActive ? (
            <div className="flex items-center justify-between gap-3 rounded-md border bg-background/70 px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="text-muted-foreground">Bill discount</div>
                <div className="truncate font-semibold text-amber-700">
                  {activeBillDiscountLabel}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={openBillDiscountEditor}
                  disabled={isReadOnly}
                  className="h-7 px-2 text-xs"
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleBillDiscountRemove}
                  disabled={isReadOnly}
                  className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <DiscountHoverCard
              open={billDiscountOpen}
              onOpenChange={setBillDiscountOpen}
              title="Bill discount"
              subjectLabel={activeDraft?.tabLabel ?? "Current bill"}
              triggerLabel="Add bill discount"
              currentType={activeBillDiscountType}
              currentValue={activeBillDiscountValue}
              amountCap={preDiscountGrandTotal}
              currentSummary={activeBillDiscountLabel}
              isReadOnly={isReadOnly}
              quickPicks={[]}
              footerNote="Applies to this bill only"
              percentageClampMessage="Discount capped at 100%."
              amountClampMessage="Discount capped at bill total."
              onValueChange={(
                discountType: "PERCENTAGE" | "FLAT",
                discountValue: number,
              ) => {
                commitBillDiscount(discountType, discountValue);
              }}
              onValueCommit={(
                discountType: "PERCENTAGE" | "FLAT",
                discountValue: number,
              ) => {
                commitBillDiscount(discountType, discountValue, true);
              }}
              onRemove={handleBillDiscountRemove}
            />
          )}

          {billDiscountIsActive ? (
            <DiscountHoverCard
              open={billDiscountOpen}
              onOpenChange={setBillDiscountOpen}
              title="Bill discount"
              subjectLabel={activeDraft?.tabLabel ?? "Current bill"}
              triggerLabel="Edit bill discount"
              hideTrigger={true}
              currentType={activeBillDiscountType}
              currentValue={activeBillDiscountValue}
              amountCap={preDiscountGrandTotal}
              currentSummary={activeBillDiscountLabel}
              isReadOnly={isReadOnly}
              quickPicks={[]}
              footerNote="Applies to this bill only"
              percentageClampMessage="Discount capped at 100%."
              amountClampMessage="Discount capped at bill total."
              onValueChange={(
                discountType: "PERCENTAGE" | "FLAT",
                discountValue: number,
              ) => {
                commitBillDiscount(discountType, discountValue);
              }}
              onValueCommit={(
                discountType: "PERCENTAGE" | "FLAT",
                discountValue: number,
              ) => {
                commitBillDiscount(discountType, discountValue, true);
              }}
              onRemove={handleBillDiscountRemove}
            />
          ) : null}
        </div>

        <Separator />
        <div className="p-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <MoneyText amount={subtotalBeforeItemDiscounts} />
          </div>

          {showItemDiscounts && (
            <>
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Item discounts</span>
                <MoneyText amount={-Math.abs(itemDiscountTotal)} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  After item discounts
                </span>
                <MoneyText amount={subtotal} />
              </div>
            </>
          )}

          {showGstLine && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <MoneyText amount={gstAmount} />
            </div>
          )}

          {showBillDiscountLine && (
            <div className="flex justify-between text-sm text-amber-700">
              <span>{billDiscountSummaryLabel}</span>
              <MoneyText amount={-Math.abs(calcResult.billDiscountAmount)} />
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="font-semibold text-base">Grand Total</span>
            <MoneyText
              amount={grandTotal}
              className="text-xl font-bold text-primary"
            />
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 gap-2 flex flex-col">
        <div
          className="flex gap-2 mb-2 flex-wrap"
          ref={paymentButtonsRef}
          role="group"
          aria-label="Payment method selection"
        >
          {PAYMENT_METHODS.map((method) => (
            <Button
              key={method}
              variant={paymentMethod === method ? "default" : "outline"}
              size="sm"
              className="flex-1 min-w-20 text-xs h-9 sm:h-8"
              onClick={() => {
                if (!isReadOnly) {
                  onPaymentMethodChange(method);
                  announceAction(`Payment method changed to ${method}`);
                }
              }}
              onKeyDown={(e) => {
                const buttons = Array.from(
                  paymentButtonsRef.current?.querySelectorAll("button") || [],
                );
                const currentIndex = buttons.findIndex((btn) =>
                  btn.textContent?.includes(method),
                );

                let nextIndex = currentIndex;
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  nextIndex = (currentIndex + 1) % buttons.length;
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  nextIndex =
                    (currentIndex - 1 + buttons.length) % buttons.length;
                } else {
                  return;
                }

                const nextButton = buttons[nextIndex] as HTMLButtonElement;
                nextButton?.focus();
                const nextMethod = nextButton?.textContent?.trim() as
                  | PaymentMethod
                  | undefined;
                if (nextMethod) {
                  onPaymentMethodChange(nextMethod);
                }
              }}
              aria-pressed={paymentMethod === method}
              aria-label={`${method} payment method`}
              disabled={isReadOnly}
            >
              {method}
            </Button>
          ))}
        </div>
        <Button
          size="lg"
          className="w-full font-bold text-base  sm:text-base"
          disabled={!isEnabled || isFinalizing || isReadOnly}
          onClick={() => {
            onFinalize();
            announceAction("Invoice finalized successfully");
          }}
          aria-busy={isFinalizing}
        >
          {isFinalizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Finalize Invoice"
          )}
        </Button>
        {isEnabled && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground mt-1 h-9 sm:h-8 text-xs sm:text-sm"
            onClick={openClearDialog}
            disabled={isReadOnly}
          >
            Clear Bill
          </Button>
        )}
      </div>
      <ConfirmationDialog
        isOpen={confirmZeroOpen}
        title="Apply 100% Discount?"
        description="This makes the bill total ₹0. Continue?"
        confirmText="Apply"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={() => {
          const pending = pendingBillDiscountRef.current;
          if (pending && activeDraft?.clientDraftId) {
            setBillDiscount(
              activeDraft.clientDraftId,
              pending.type,
              pending.value,
            );
          }

          pendingBillDiscountRef.current = null;
          setConfirmZeroOpen(false);
        }}
        onCancel={() => {
          pendingBillDiscountRef.current = null;
          setConfirmZeroOpen(false);
        }}
      />
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    </div>
  );
}
