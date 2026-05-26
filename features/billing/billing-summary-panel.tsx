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

  const [billDiscountOpen, setBillDiscountOpen] = useState(false);
  const activeBillDiscountType = (activeDraft?.billDiscountType ?? "NONE") as
    | "NONE"
    | "PERCENTAGE"
    | "FLAT";
  const activeBillDiscountValue = activeDraft?.billDiscountValue ?? 0;

  const [localBillType, setLocalBillType] = useState<
    "NONE" | "PERCENTAGE" | "FLAT"
  >(activeBillDiscountType);
  const [localBillValue, setLocalBillValue] = useState<number>(
    activeBillDiscountValue,
  );
  const [confirmZeroOpen, setConfirmZeroOpen] = useState(false);
  const [billClampMessage, setBillClampMessage] = useState<string | null>(null);
  const prevBillRef = useRef({ type: localBillType, value: localBillValue });
  const pendingBillDiscountRef = useRef<{
    type: "PERCENTAGE" | "FLAT";
    value: number;
  } | null>(null);
  const billDebounceRef = useRef<number | null>(null);
  const billClampTimeoutRef = useRef<number | null>(null);

  const activeBillDiscountLabel = useMemo(() => {
    if (activeBillDiscountType === "NONE" || activeBillDiscountValue <= 0) {
      return null;
    }

    return activeBillDiscountType === "PERCENTAGE"
      ? `−${activeBillDiscountValue.toFixed(0)}%`
      : `−₹${activeBillDiscountValue.toFixed(2)}`;
  }, [activeBillDiscountType, activeBillDiscountValue]);

  const billDiscountIsActive = activeBillDiscountType !== "NONE";

  const clearBillClampMessage = () => {
    if (billClampTimeoutRef.current) {
      window.clearTimeout(billClampTimeoutRef.current);
      billClampTimeoutRef.current = null;
    }
    setBillClampMessage(null);
  };

  const normalizeBillDiscountValue = (
    discountType: "PERCENTAGE" | "FLAT",
    rawValue: number,
  ): { value: number; message: string | null } => {
    let normalizedValue = Math.max(0, rawValue);
    let message: string | null = null;

    if (discountType === "PERCENTAGE") {
      normalizedValue = Math.min(100, normalizedValue);
    } else {
      const cap = Math.max(0, calcResult.preDiscountGrandTotal);

      if (normalizedValue > cap) {
        normalizedValue = cap;
        message = "Discount capped at bill total.";
      }
    }

    return {
      value: Math.round(normalizedValue * 100) / 100,
      message,
    };
  };

  const commitBillDiscount = (
    discountType: "NONE" | "PERCENTAGE" | "FLAT",
    rawValue: number,
    immediate = false,
  ) => {
    if (!activeDraft?.clientDraftId) {
      return;
    }

    const normalizedResult =
      discountType === "NONE"
        ? { value: 0, message: null }
        : normalizeBillDiscountValue(discountType, rawValue);
    const normalizedValue = normalizedResult.value;
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
      if (normalizedResult.message) {
        setBillClampMessage(normalizedResult.message);
        if (billClampTimeoutRef.current) {
          window.clearTimeout(billClampTimeoutRef.current);
        }
        billClampTimeoutRef.current = window.setTimeout(
          clearBillClampMessage,
          3000,
        ) as unknown as number;
      }

      if (discountType !== "NONE" && wouldZeroGrandTotal && !isSameAsActive) {
        pendingBillDiscountRef.current = {
          type: discountType,
          value: normalizedValue,
        };
        setConfirmZeroOpen(true);
        return;
      }

      pendingBillDiscountRef.current = null;
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

  const handleBillTypeChange = (nextType: "PERCENTAGE" | "FLAT") => {
    if (isReadOnly) {
      return;
    }

    prevBillRef.current = {
      type: activeBillDiscountType,
      value: activeBillDiscountValue,
    };
    clearBillClampMessage();
    setLocalBillType(nextType);
    setLocalBillValue(0);
    commitBillDiscount(nextType, 0, true);
  };

  const handleBillValueChange = (nextValue: number) => {
    if (isReadOnly) {
      return;
    }

    clearBillClampMessage();
    const normalizedValue = Math.max(0, nextValue);
    setLocalBillValue(normalizedValue);
    commitBillDiscount(localBillType, normalizedValue);
  };

  const handleBillValueBlur = () => {
    if (isReadOnly) {
      return;
    }

    clearBillClampMessage();
    commitBillDiscount(localBillType, localBillValue, true);
  };

  const handleBillDiscountRemove = () => {
    clearBillClampMessage();
    pendingBillDiscountRef.current = null;
    clearBillDiscount(activeDraft?.clientDraftId ?? "");
    setBillDiscountOpen(false);
    setLocalBillType("NONE");
    setLocalBillValue(0);
  };

  useEffect(() => {
    setLocalBillType(activeBillDiscountType);
    setLocalBillValue(activeBillDiscountValue);
  }, [activeBillDiscountType, activeBillDiscountValue]);

  useEffect(
    () => () => {
      if (billDebounceRef.current) {
        window.clearTimeout(billDebounceRef.current);
      }

      if (billClampTimeoutRef.current) {
        window.clearTimeout(billClampTimeoutRef.current);
      }
    },
    [],
  );

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
  const showAfterItemDiscounts = showItemDiscounts;
  const showGstLine = gstEnabled && Math.abs(gstAmount) > 0;
  const showBillDiscountLine = calcResult.billDiscountAmount > 0;
  const billDiscountSummaryLabel =
    activeBillDiscountType === "PERCENTAGE"
      ? `Bill discount (${activeBillDiscountValue.toFixed(0)}%)`
      : "Bill discount";

  const handlePaymentKeyDown = (
    e: React.KeyboardEvent,
    method: PaymentMethod,
  ) => {
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
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
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
  };

  const announceAction = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  return (
    <div className="border-t bg-muted/30 shrink-0">
      <div className="p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <MoneyText amount={subtotal} />
        </div>
        {/* Bill discount input / control */}
        <div>
          {(activeDraft?.billDiscountType ?? "NONE") === "NONE" &&
          !billDiscountOpen ? (
            <Button
              type="button"
              variant="link"
              className="text-xs text-primary"
              onClick={() => setBillDiscountOpen(true)}
              disabled={isReadOnly}
            >
              Add bill discount
            </Button>
          ) : null}

          {(billDiscountOpen ||
            (activeDraft?.billDiscountType ?? "NONE") !== "NONE") && (
            <div className="mt-2 p-2 bg-muted/20 rounded">
              {billDiscountIsActive && activeBillDiscountLabel ? (
                <div className="mb-3 flex items-center justify-between rounded-md border bg-background/70 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Active discount</span>
                  <span className="font-semibold text-amber-700">
                    {activeBillDiscountLabel}
                  </span>
                  <button
                    type="button"
                    className="text-rose-600"
                    onClick={handleBillDiscountRemove}
                    disabled={isReadOnly}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`px-2 py-1 rounded ${localBillType === "PERCENTAGE" ? "bg-primary text-white" : "bg-transparent"}`}
                    onClick={() => handleBillTypeChange("PERCENTAGE")}
                    disabled={isReadOnly}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded ${localBillType === "FLAT" ? "bg-primary text-white" : "bg-transparent"}`}
                    onClick={() => handleBillTypeChange("FLAT")}
                    disabled={isReadOnly}
                  >
                    ₹
                  </button>
                </div>
              </div>
              <div className="mb-2">
                <label className="text-sm font-medium mb-1 block">Value</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={localBillValue}
                  onChange={(e) => {
                    handleBillValueChange(Number(e.target.value || 0));
                  }}
                  onBlur={handleBillValueBlur}
                  disabled={isReadOnly}
                  className="border rounded px-2 py-1 w-32"
                />
                {billClampMessage ? (
                  <p className="mt-1 text-xs text-amber-700">
                    {billClampMessage}
                  </p>
                ) : null}
              </div>
              <div>
                <button
                  type="button"
                  className="text-sm text-rose-600"
                  onClick={handleBillDiscountRemove}
                  disabled={isReadOnly}
                >
                  Remove discount
                </button>
              </div>
            </div>
          )}
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
              onKeyDown={(e) => handlePaymentKeyDown(e, method)}
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
          clearBillClampMessage();
          setConfirmZeroOpen(false);
        }}
        onCancel={() => {
          pendingBillDiscountRef.current = null;
          clearBillClampMessage();
          setLocalBillType(prevBillRef.current.type as any);
          setLocalBillValue(prevBillRef.current.value);
          setConfirmZeroOpen(false);
        }}
      />
      {/* Hidden live region for screen reader announcements */}
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
