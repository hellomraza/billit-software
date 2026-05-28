"use client";

import React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsTabBar } from "./analytics-tab-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, IndianRupee, RefreshCw } from "lucide-react";
import { PeriodSelector } from "./period-selector";
import { OverviewCards } from "./overview-cards";
import { RevenueBarChart } from "./revenue-bar-chart";

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

export interface RevenueChartData {
  aggregation: "daily" | "weekly" | "hourly";
  dataPoints: Array<{
    label: string;
    netRevenue: number;
    grossRevenue: number;
    discounts: number;
    invoiceCount: number;
  }>;
}

export interface TopProductItem {
  rank: number;
  productId: string;
  productName: string;
  netRevenue: number;
  unitsSold: number;
  percentOfTotal: number;
}

export interface TopProductsData {
  topProducts: TopProductItem[];
  totalNetRevenue: number;
}

export interface PaymentBreakdownItem {
  method: "CASH" | "CARD" | "UPI";
  invoiceCount: number;
  totalAmount: number;
  percentage: number;
}

export interface PaymentBreakdownData {
  breakdown: PaymentBreakdownItem[];
  totalInvoices: number;
}

export interface GstSummaryData {
  totalGstCollected: number;
  gstInvoiceCount: number;
  nonGstInvoiceCount: number;
  hasGstData: boolean;
}

interface RevenueOverviewScreenProps {
  revenueSummary: RevenueSummaryData;
  revenueChartData: RevenueChartData;
  topProducts: TopProductsData;
  paymentBreakdown: PaymentBreakdownData;
  gstSummary: GstSummaryData;
  period: string;
  dateFrom?: string;
  dateTo?: string;
}

export function RevenueOverviewScreen({
  revenueSummary,
  revenueChartData,
  topProducts,
  paymentBreakdown,
  gstSummary,
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

      <OverviewCards revenueSummary={revenueSummary} />

      <RevenueBarChart
        dataPoints={revenueChartData.dataPoints}
        aggregation={revenueChartData.aggregation}
      />

      {/* Info footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-dashed bg-card/10 p-4 rounded-xl border">
        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground/60" />
        <span>
          Showing records from <strong className="text-foreground">{startDate}</strong> to <strong className="text-foreground">{endDate}</strong>. 
          Additional charts, GST overview, and product breakdowns will appear below as they are integrated.
        </span>
      </div>
    </div>
  );
}
