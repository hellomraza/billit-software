import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsTabBar } from "@/features/analytics/analytics-tab-bar";

export default function RevenueOverviewLoading() {
  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Analytics & Insights"
        description="Monitor your inventory health, deficits, and sales analytics."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Analytics", href: "/analytics/revenue" },
          { label: "Revenue Overview" },
        ]}
      />

      {/* 2. Tabs */}
      <AnalyticsTabBar />

      {/* 3. Period Selector Skeleton */}
      <div className="bg-card/50 border rounded-xl p-2 flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* 4. Overview Cards Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="border rounded-xl p-5 bg-card space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg shrink-0 animate-pulse bg-muted/70" />
            </div>
          </div>
        ))}
      </div>

      {/* 5. Revenue Bar Chart Skeleton */}
      <div className="border rounded-xl p-6 bg-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>

        {/* Mocking Recharts Bar Chart Bars */}
        <div className="h-[280px] flex items-end gap-3 sm:gap-6 px-4 pt-4 border-b border-l">
          {Array.from({ length: 12 }).map((_, idx) => {
            // Generating semi-staggered heights for realistic skeleton visual representation
            const heights = ["h-[40%]", "h-[75%]", "h-[55%]", "h-[90%]", "h-[30%]", "h-[65%]", "h-[85%]", "h-[50%]", "h-[70%]", "h-[45%]", "h-[95%]", "h-[60%]"];
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton className={`w-full rounded-t-md bg-muted/60 animate-pulse ${heights[idx]}`} />
                <Skeleton className="h-3 w-8 mt-2" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Top Products List Skeleton */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-60" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="space-y-4 pt-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded-lg border border-dashed">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Rank number skeleton */}
                <Skeleton className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center bg-muted/80" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-[40%] max-w-[200px]" />
                  {/* Progress bar mock */}
                  <Skeleton className="h-1.5 w-[70%]" />
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0 text-right">
                <div className="space-y-1.5 hidden sm:block">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
                <Skeleton className="h-4.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Payment Breakdown Skeleton */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-60" />
          </div>
          <Skeleton className="h-4.5 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border rounded-xl p-4 bg-muted/20 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4.5 w-10 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 8. GST Summary Section Skeleton (Pulsing Mockup) */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-1 border-r pr-6 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-36" />
          </div>
          <div className="md:col-span-2 flex flex-col justify-center space-y-2">
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-3.5 w-[50%]" />
          </div>
        </div>

        {/* Disclaimer placeholder */}
        <div className="bg-muted/30 border border-dashed rounded-lg p-3 mt-4">
          <Skeleton className="h-3 w-[80%] mx-auto" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="flex items-center gap-2 p-4 rounded-xl border border-dashed bg-card/10">
        <Skeleton className="h-4 w-4 rounded-full shrink-0" />
        <Skeleton className="h-3.5 w-[60%]" />
      </div>
    </div>
  );
}
