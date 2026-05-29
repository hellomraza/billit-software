"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatIndianCurrency } from "@/lib/utils/format";
import { CreditCard, Banknote, Smartphone, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentBreakdownItem {
  paymentMethod: "CASH" | "CARD" | "UPI";
  invoiceCount: number;
  totalAmount: number;
  percentage: number;
}

interface PaymentBreakdownData {
  paymentBreakdown: PaymentBreakdownItem[];
  totalInvoices: number;
}

interface PaymentBreakdownProps {
  paymentBreakdownData: PaymentBreakdownData;
}

const defaultMethods = [
  {
    method: "CASH" as const,
    label: "Cash",
    icon: Banknote,
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100/50",
  },
  {
    method: "CARD" as const,
    label: "Card",
    icon: CreditCard,
    color: "bg-indigo-500",
    bgColor: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100/50",
  },
  {
    method: "UPI" as const,
    label: "UPI",
    icon: Smartphone,
    color: "bg-violet-500",
    bgColor: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border-violet-100/50",
  },
];

export function PaymentBreakdown({ paymentBreakdownData }: PaymentBreakdownProps) {
  const breakdown = paymentBreakdownData.paymentBreakdown;

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
        <Receipt className="h-5 w-5 text-primary" />
        <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {defaultMethods.map((m) => {
            // Find matched item or default to empty values
            const matched = breakdown?.find((b) => b.paymentMethod === m.method) || {
              invoiceCount: 0,
              totalAmount: 0,
              percentage: 0,
            };

            const widthPct = Math.min(100, Math.max(0, matched.percentage));
            const Icon = m.icon;

            return (
              <div
                key={m.method}
                className="group hover:bg-muted/10 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-border/30 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Themed soft background icon */}
                    <div className={cn("p-1.5 rounded-lg border shrink-0", m.bgColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-foreground">{m.label}</span>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <span className="text-muted-foreground font-medium">
                      {matched.invoiceCount} {matched.invoiceCount === 1 ? "invoice" : "invoices"}
                    </span>
                    <span className="font-bold text-foreground">
                      {formatIndianCurrency(matched.totalAmount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold bg-muted/60 dark:bg-muted/30 px-1.5 py-0.5 rounded-sm">
                      {matched.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Proportional progress bar */}
                <div className="h-1.5 w-full bg-muted/40 dark:bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", m.color)}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
