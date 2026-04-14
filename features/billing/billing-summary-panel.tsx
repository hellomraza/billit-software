"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MoneyText } from "@/components/shared/money-text";
import { PAYMENT_METHODS } from "@/lib/constants/defaults";

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
  isEnabled
}: BillingSummaryPanelProps) {
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
          <MoneyText amount={grandTotal} className="text-xl font-bold text-primary" />
        </div>
      </div>
      
      <div className="p-4 pt-0 gap-2 flex flex-col">
        <div className="flex gap-2 mb-2">
          {PAYMENT_METHODS.map(method => (
            <Button 
              key={method}
              variant={paymentMethod === method ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => onPaymentMethodChange(method)}
            >
              {method}
            </Button>
          ))}
        </div>
        <Button 
          size="lg" 
          className="w-full font-bold" 
          disabled={!isEnabled}
          onClick={onFinalize}
        >
          Finalize Invoice
        </Button>
        {isEnabled && (
          <Button variant="ghost" className="w-full text-muted-foreground mt-1 h-8 text-xs" onClick={onClear}>
            Clear Bill
          </Button>
        )}
      </div>
    </div>
  );
}
