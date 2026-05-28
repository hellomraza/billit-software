"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatIndianCurrency } from "@/lib/utils/format";
import { ShieldCheck, Info } from "lucide-react";

interface GstSummaryData {
  totalGstCollected: number;
  gstInvoiceCount: number;
  nonGstInvoiceCount: number;
  hasGstData: boolean;
}

interface GstSummarySectionProps {
  gstSummary: GstSummaryData;
}

export function GstSummarySection({ gstSummary }: GstSummarySectionProps) {
  const { totalGstCollected, gstInvoiceCount, nonGstInvoiceCount, hasGstData } = gstSummary;

  // Conditional rendering: Entirely hide the section if there's no GST activity in the period
  if (!hasGstData) return null;

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <CardTitle className="text-base font-semibold">GST Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/15 dark:bg-muted/5 p-4 rounded-xl border border-border/30">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total GST Collected
            </span>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {formatIndianCurrency(totalGstCollected)}
            </h2>
          </div>

          <div className="text-xs text-muted-foreground font-semibold sm:text-right space-y-0.5 shrink-0 bg-background/50 dark:bg-background/20 px-3 py-2 rounded-lg border border-border/50">
            <div>
              <strong className="text-foreground">{gstInvoiceCount}</strong> GST invoices
            </div>
            <div>
              <strong className="text-foreground">{nonGstInvoiceCount}</strong> non-GST invoices
            </div>
          </div>
        </div>

        {/* Premium Informative Disclaimer Note */}
        <div className="flex items-start gap-2.5 p-3.5 border rounded-xl bg-blue-50/15 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold select-none animate-in fade-in duration-300">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            This is for reference only and does not constitute a GST return filing. Please reconcile with server logs before generating quarterly reports.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
