"use client";

import { MoneyText } from "@/components/shared/money-text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_METHODS } from "@/lib/constants/defaults";
import { Loader2 } from "lucide-react";
import { useRef } from "react";

interface BillingSummaryPanelProps {
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  isGstEnabled: boolean;
  paymentMethod: string;
  onPaymentMethodChange: (method: any) => void;
  onFinalize: () => void;
  onClear: () => void;
  isEnabled: boolean;
  isFinalizing?: boolean;
}

export function BillingSummaryPanel({
  subtotal,
  gstAmount,
  grandTotal,
  isGstEnabled,
  paymentMethod,
  onPaymentMethodChange,
  onFinalize,
  onClear,
  isEnabled,
  isFinalizing = false,
}: BillingSummaryPanelProps) {
  const paymentButtonsRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  const handlePaymentKeyDown = (e: React.KeyboardEvent, method: string) => {
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
    const nextMethod = nextButton?.textContent || "";
    onPaymentMethodChange(nextMethod.trim());
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
        {isGstEnabled && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST</span>
            <MoneyText amount={gstAmount} />
          </div>
        )}
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-base">Grand Total</span>
          <MoneyText
            amount={grandTotal}
            className="text-xl font-bold text-primary"
          />
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
              className="flex-1 min-w-[80px] text-xs h-9 sm:h-8"
              onClick={() => {
                onPaymentMethodChange(method);
                announceAction(`Payment method changed to ${method}`);
              }}
              onKeyDown={(e) => handlePaymentKeyDown(e, method)}
              aria-pressed={paymentMethod === method}
              aria-label={`${method} payment method`}
            >
              {method}
            </Button>
          ))}
        </div>
        <Button
          size="lg"
          className="w-full font-bold h-12 text-base sm:h-auto sm:text-base"
          disabled={!isEnabled || isFinalizing}
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
            onClick={onClear}
          >
            Clear Bill
          </Button>
        )}
      </div>
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
