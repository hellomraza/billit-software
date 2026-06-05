"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatIndianCurrency } from "@/lib/utils/format";
import { CreditCard, Banknote, Smartphone, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
    chartColor: "#10b981", // Emerald 500
    bgColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100/50",
  },
  {
    method: "CARD" as const,
    label: "Card",
    icon: CreditCard,
    color: "bg-indigo-500",
    chartColor: "#6366f1", // Indigo 500
    bgColor: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100/50",
  },
  {
    method: "UPI" as const,
    label: "UPI",
    icon: Smartphone,
    color: "bg-violet-500",
    chartColor: "#8b5cf6", // Violet 500
    bgColor: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border-violet-100/50",
  },
];

export function PaymentBreakdown({ paymentBreakdownData }: PaymentBreakdownProps) {
  const breakdown = paymentBreakdownData.paymentBreakdown;

  // Prepare chart data
  const chartData = defaultMethods.map((m) => {
    const matched = breakdown?.find((b) => b.paymentMethod === m.method) || {
      invoiceCount: 0,
      totalAmount: 0,
      percentage: 0,
    };
    return {
      name: m.label,
      value: matched.totalAmount,
      percentage: matched.percentage,
      invoiceCount: matched.invoiceCount,
      ...m,
    };
  });

  const hasData = chartData.some((d) => d.value > 0);
  const emptyChartData = [{ name: "No data", value: 1, chartColor: "#cbd5e1" }];

  return (
    <Card className="border border-border h-full flex flex-col">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-4 shrink-0">
        <Receipt className="h-5 w-5 text-primary" />
        <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 flex-1 flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="h-[180px] w-[180px] shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasData ? chartData : emptyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={hasData ? 4 : 0}
                  dataKey="value"
                >
                  {(hasData ? chartData : emptyChartData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.chartColor} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text inside Donut */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Invoices
              </span>
              <span className="text-xl font-black text-foreground">
                {paymentBreakdownData.totalInvoices}
              </span>
            </div>
          </div>

          {/* Details List */}
          <div className="flex-1 space-y-3.5 w-full">
            {defaultMethods.map((m) => {
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
                  className="group hover:bg-muted/10 p-2.5 rounded-xl transition-all duration-200 border border-transparent hover:border-border/30 space-y-2"
                >
                  <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("p-1.5 rounded-lg border shrink-0", m.bgColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-foreground">{m.label}</span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <span className="text-muted-foreground font-medium text-[10px]">
                        {matched.invoiceCount} {matched.invoiceCount === 1 ? "inv" : "invs"}
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
                  <div className="h-1 w-full bg-muted/40 dark:bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", m.color)}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
