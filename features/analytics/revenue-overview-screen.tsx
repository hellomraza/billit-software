"use client";

import React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsTabBar } from "./analytics-tab-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, IndianRupee, RefreshCw } from "lucide-react";
import { PeriodSelector } from "./period-selector";

export interface RevenueSummaryData {
  period: string;
  startDate: string;
  endDate: string;
  totalNetRevenue: number;
  totalInvoices: number;
  totalRefundsCount: number;
  totalRefundsAmount: number;
  avgInvoiceValue: number;
}

interface RevenueOverviewScreenProps {
  revenueSummary: RevenueSummaryData;
  period: string;
  dateFrom?: string;
  dateTo?: string;
}

export function RevenueOverviewScreen({
  revenueSummary,
  period: activePeriod,
  dateFrom,
  dateTo,
}: RevenueOverviewScreenProps) {
  const {
    period,
    startDate,
    endDate,
    totalNetRevenue,
    totalInvoices,
    totalRefundsCount,
    totalRefundsAmount,
    avgInvoiceValue,
  } = revenueSummary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Insights"
        description="Monitor your inventory health, deficits, and sales analytics."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Analytics", href: "/analytics/stock" },
          { label: "Revenue Overview" },
        ]}
      />

      <AnalyticsTabBar />

      <PeriodSelector
        currentPeriod={activePeriod}
        currentDateFrom={dateFrom}
        currentDateTo={dateTo}
      />

      {/* Placeholder Screen Body to confirm T-08.1 setup */}
      <div className="space-y-6">
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Revenue Dashboard (Structure Setup)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              The page routing, API client integration, and initial server-side data fetching are functioning perfectly. Below is the active default 30-day summary data fetched from the server.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="border rounded-lg p-4 space-y-2 bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date Range</p>
                <p className="text-sm font-semibold text-foreground">{startDate} to {endDate}</p>
                <p className="text-[10px] text-muted-foreground capitalize">Period: {period.replace("_", " ")}</p>
              </div>

              <div className="border rounded-lg p-4 space-y-2 bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Net Revenue</p>
                <p className="text-lg font-bold text-emerald-600 flex items-center gap-0.5">
                  <IndianRupee className="h-4 w-4 shrink-0" />
                  {totalNetRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2 bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Invoices</p>
                <p className="text-lg font-bold text-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  {totalInvoices}
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-2 bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg. Invoice Value</p>
                <p className="text-lg font-bold text-foreground flex items-center gap-0.5">
                  <IndianRupee className="h-4 w-4 shrink-0" />
                  {avgInvoiceValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-dashed">
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground/60" />
              Placeholder structure ready. Full dashboard components (Period Selector, Charts, Payment Methods, GST) will be integrated in subsequent tasks.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
