import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsTabBar } from "@/features/analytics/analytics-tab-bar";

export default function RevenueOverviewLoading() {
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

      {/* Period Selector Skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Overview Cards Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="border rounded-xl p-5 bg-card space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg shrink-0 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[85%]" />
        </div>
      </div>
    </div>
  );
}
