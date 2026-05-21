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
import { useEffect, useRef, useState } from "react";

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
  const [localBillType, setLocalBillType] = useState<
    "NONE" | "PERCENTAGE" | "FLAT"
  >((activeDraft?.billDiscountType ?? "NONE") as any);
  const [localBillValue, setLocalBillValue] = useState<number>(
    activeDraft?.billDiscountValue ?? 0,
  );
  const [confirmZeroOpen, setConfirmZeroOpen] = useState(false);
  const prevBillRef = useRef({ type: localBillType, value: localBillValue });
  const billDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalBillType((activeDraft?.billDiscountType ?? "NONE") as any);
    setLocalBillValue(activeDraft?.billDiscountValue ?? 0);
  }, [activeDraft?.billDiscountType, activeDraft?.billDiscountValue]);

  const itemsForCalc = (activeDraft?.items ?? []).map((it) => ({
    unitPrice: it.unitPrice,
    quantity: it.quantity,
    gstRate: it.gstRate,
    itemDiscountType: (it.itemDiscountType ?? "NONE") as any,
    itemDiscountValue: it.itemDiscountValue ?? 0,
  }));

  const calcResult = calculateDiscounts(
    itemsForCalc,
    (activeDraft?.billDiscountType ?? "NONE") as any,
    activeDraft?.billDiscountValue ?? 0,
    useIsGstEnabled(),
  );

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
            <button
              className="text-xs text-primary"
              onClick={() => setBillDiscountOpen(true)}
              disabled={isReadOnly}
            >
              Add bill discount
            </button>
          ) : null}

          {(billDiscountOpen ||
            (activeDraft?.billDiscountType ?? "NONE") !== "NONE") && (
            <div className="mt-2 p-2 bg-muted/20 rounded">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  <button
                    className={`px-2 py-1 rounded ${localBillType === "PERCENTAGE" ? "bg-primary text-white" : "bg-transparent"}`}
                    onClick={() => {
                      setLocalBillType("PERCENTAGE");
                      prevBillRef.current = {
                        type: localBillType,
                        value: localBillValue,
                      };
                      setBillDiscount(
                        activeDraft?.clientDraftId ?? "",
                        "PERCENTAGE",
                        0,
                      );
                    }}
                    disabled={isReadOnly}
                  >
                    %
                  </button>
                  <button
                    className={`px-2 py-1 rounded ${localBillType === "FLAT" ? "bg-primary text-white" : "bg-transparent"}`}
                    onClick={() => {
                      setLocalBillType("FLAT");
                      prevBillRef.current = {
                        type: localBillType,
                        value: localBillValue,
                      };
                      setBillDiscount(
                        activeDraft?.clientDraftId ?? "",
                        "FLAT",
                        0,
                      );
                    }}
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
                    const v = Number(e.target.value || 0);
                    setLocalBillValue(v);
                    if (billDebounceRef.current)
                      window.clearTimeout(billDebounceRef.current);
                    billDebounceRef.current = window.setTimeout(() => {
                      prevBillRef.current = {
                        type: localBillType,
                        value: activeDraft?.billDiscountValue ?? 0,
                      };
                      setBillDiscount(
                        activeDraft?.clientDraftId ?? "",
                        localBillType,
                        Math.max(0, v),
                      );
                    }, 300) as unknown as number;
                  }}
                  onBlur={() => {
                    // If the proposed discount makes grand total zero, ask for confirmation
                    const proposedType = localBillType;
                    const proposedValue = localBillValue;
                    const res = calculateDiscounts(
                      itemsForCalc,
                      proposedType as any,
                      proposedValue,
                      useIsGstEnabled(),
                    );
                    if (res.grandTotal === 0) {
                      // open confirm dialog
                      setConfirmZeroOpen(true);
                    } else {
                      // ensure applied via setBillDiscount (store clamps)
                      prevBillRef.current = {
                        type: localBillType,
                        value: activeDraft?.billDiscountValue ?? 0,
                      };
                      setBillDiscount(
                        activeDraft?.clientDraftId ?? "",
                        localBillType,
                        Math.max(0, proposedValue),
                      );
                    }
                  }}
                  disabled={isReadOnly}
                  className="border rounded px-2 py-1 w-32"
                />
              </div>
              <div>
                <button
                  className="text-sm text-rose-600"
                  onClick={() => {
                    clearBillDiscount(activeDraft?.clientDraftId ?? "");
                    setBillDiscountOpen(false);
                  }}
                  disabled={isReadOnly}
                >
                  Remove discount
                </button>
              </div>
            </div>
          )}
        </div>
        {gstEnabled && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST</span>
            <MoneyText amount={gstAmount} />
          </div>
        )}
        <Separator />
        {/* Detailed breakdown: show bill discount line when present */}
        <div className="p-1">
          {gstEnabled && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST</span>
              <MoneyText amount={gstAmount} />
            </div>
          )}
          {calcResult.billDiscountAmount > 0 && (
            <div className="flex justify-between text-sm text-amber-700">
              <span>
                Bill discount{" "}
                {activeDraft?.billDiscountType === "PERCENTAGE"
                  ? `(${(activeDraft?.billDiscountValue ?? 0).toFixed(0)}%)`
                  : ""}
              </span>
              <MoneyText amount={-Math.abs(calcResult.billDiscountAmount)} />
            </div>
          )}
          <div className="flex justify-between items-center">
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
          // apply the discount
          setBillDiscount(
            activeDraft?.clientDraftId ?? "",
            localBillType,
            localBillValue,
          );
          setConfirmZeroOpen(false);
        }}
        onCancel={() => {
          // revert to previous
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
