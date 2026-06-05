"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsTabBar } from "./analytics-tab-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, IndianRupee, RefreshCw } from "lucide-react";
import { PeriodSelector } from "./period-selector";
import { OverviewCards } from "./overview-cards";
import { RevenueBarChart } from "./revenue-bar-chart";
import { TopProductsList } from "./top-products-list";
import { PaymentBreakdown } from "./payment-breakdown";
import { GstSummarySection } from "./gst-summary-section";
import { getTopProducts } from "@/lib/api/analytics";
import { cn } from "@/lib/utils";

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
  totalUnitsSold: number;
}

export interface PaymentBreakdownItem {
  paymentMethod: "CASH" | "CARD" | "UPI";
  invoiceCount: number;
  totalAmount: number;
  percentage: number;
}

export interface PaymentBreakdownData {
  paymentBreakdown: PaymentBreakdownItem[];
  totalInvoices: number;
}

export interface GstSummaryData {
  totalGstCollected: number;
  gstInvoiceCount: number;
  nonGstInvoiceCount: number;
  hasGstData: boolean;
}

interface RevenueOverviewScreenProps {
  tenantId: string;
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
  tenantId,
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

  const [sortBy, setSortBy] = useState<"revenue" | "units_sold">("units_sold");
  const [topProductsData, setTopProductsData] = useState<TopProductsData>(topProducts);
  const [loadingTopProducts, setLoadingTopProducts] = useState(false);

  useEffect(() => {
    if (sortBy === "units_sold") {
      setTopProductsData(topProducts);
    }
  }, [topProducts, sortBy]);

  useEffect(() => {
    if (sortBy === "units_sold") return;

    let isMounted = true;
    setLoadingTopProducts(true);
    getTopProducts(tenantId, activePeriod, dateFrom, dateTo, sortBy)
      .then((data) => {
        if (isMounted) {
          setTopProductsData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch top products:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingTopProducts(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [sortBy, activePeriod, dateFrom, dateTo, tenantId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Insights"
        description="Monitor your inventory health, deficits, and sales analytics."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Analytics", href: "/analytics/revenue" },
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

      <TopProductsList
        topProductsData={topProductsData}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        loading={loadingTopProducts}
      />

      <div className={cn(
        "grid grid-cols-1 gap-6",
        gstSummary.hasGstData && "lg:grid-cols-2"
      )}>
        <PaymentBreakdown paymentBreakdownData={paymentBreakdown} />
        <GstSummarySection gstSummary={gstSummary} />
      </div>

      {/* Info footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-dashed bg-card/10 p-4 rounded-xl border">
        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground/60" />
        <span>
          Showing records from <strong className="text-foreground">{startDate}</strong> to <strong className="text-foreground">{endDate}</strong>.
          Period changes update all sections simultaneously.
        </span>
      </div>
    </div>
  );
}
