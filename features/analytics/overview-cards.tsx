"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatIndianCurrency } from "@/lib/utils/format";
import { TrendingUp, FileText, AlertTriangle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueSummaryData {
  period: string;
  startDate: string;
  endDate: string;
  totalNetRevenue: number;
  totalInvoices: number;
  totalRefundsCount: number;
  totalRefundsAmount: number;
  avgInvoiceValue: number;
}

interface OverviewCardsProps {
  revenueSummary: RevenueSummaryData;
}

export function OverviewCards({ revenueSummary }: OverviewCardsProps) {
  const {
    totalNetRevenue,
    totalInvoices,
    totalRefundsCount,
    totalRefundsAmount,
    avgInvoiceValue,
  } = revenueSummary;

  const cardItems = [
    {
      title: "Total Revenue",
      value: formatIndianCurrency(totalNetRevenue),
      description: "Net revenue in period",
      icon: TrendingUp,
      className: "border-emerald-100 bg-emerald-50/15 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400",
      iconClassName: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Invoices",
      value: totalInvoices.toLocaleString(),
      description: "SALE invoices issued",
      icon: FileText,
      className: "border-indigo-100 bg-indigo-50/15 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-400",
      iconClassName: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Total Refunds",
      value: `${totalRefundsCount} refunds`,
      subValue: formatIndianCurrency(totalRefundsAmount), // Amount is negative
      description: "Returned items amount",
      icon: AlertTriangle,
      className: "border-rose-100 bg-rose-50/15 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400",
      iconClassName: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
    },
    {
      title: "Avg Invoice Value",
      value: formatIndianCurrency(avgInvoiceValue),
      description: "Revenue per invoice",
      icon: ArrowUpRight,
      className: "border-violet-100 bg-violet-50/15 dark:bg-violet-950/10 text-violet-700 dark:text-violet-400",
      iconClassName: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card
            key={idx}
            className={cn(
              "border hover:shadow-xs transition-all duration-300 group overflow-hidden relative",
              item.className
            )}
          >
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.title}
                </p>
                <h3 className="text-lg font-bold text-foreground truncate tracking-tight">
                  {item.value}
                </h3>
                {item.subValue && (
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 pt-0.5 truncate">
                    {item.subValue}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/80 font-medium">
                  {item.description}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-105", item.iconClassName)}>
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
