"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatIndianCurrency } from "@/lib/utils/format";
import { Sparkles, PackageOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopProductItem {
  rank: number;
  productId: string;
  productName: string;
  netRevenue: number;
  unitsSold: number;
  percentOfTotal: number;
}

interface TopProductsData {
  topProducts: TopProductItem[];
  totalNetRevenue: number;
  totalUnitsSold: number;
}

interface TopProductsListProps {
  topProductsData: TopProductsData;
  sortBy: "revenue" | "units_sold";
  onSortByChange: (value: "revenue" | "units_sold") => void;
  loading?: boolean;
}

export function TopProductsList({
  topProductsData,
  sortBy,
  onSortByChange,
  loading = false,
}: TopProductsListProps) {
  const { topProducts } = topProductsData;

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <CardTitle className="text-base font-semibold">Top Performing Products</CardTitle>
        </div>
        <div className="flex rounded-lg border bg-muted/30 p-1 select-none">
          <button
            onClick={() => onSortByChange("revenue")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 focus-visible:outline-none",
              sortBy === "revenue"
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            By Revenue
          </button>
          <button
            onClick={() => onSortByChange("units_sold")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 focus-visible:outline-none",
              sortBy === "units_sold"
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            By Units Sold
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[0.5px] flex items-center justify-center rounded-b-xl z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Updating list...</span>
            </div>
          </div>
        )}
        {!topProducts || topProducts.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed rounded-xl p-6">
            <PackageOpen className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-semibold">No sales data for this period.</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Sales transactions will be analyzed and ranked here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.slice(0, 10).map((product) => {
              // Ensure we clamp width to maximum 100% just in case of rounding variations
              const widthPct = Math.min(100, Math.max(0, product.percentOfTotal));

              return (
                <div
                  key={product.productId}
                  className="group hover:bg-muted/10 p-2.5 rounded-xl transition-all duration-200 border border-transparent hover:border-border/30 space-y-2"
                >
                  <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Muted Rank Badge */}
                      <span className={cn(
                        "flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-bold shrink-0",
                        product.rank === 1 && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
                        product.rank === 2 && "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400",
                        product.rank === 3 && "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400",
                        product.rank > 3 && "bg-muted text-muted-foreground"
                      )}>
                        {product.rank}
                      </span>
                      <span className="font-semibold text-foreground truncate">{product.productName}</span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <span className={cn(
                        sortBy === "units_sold" ? "font-bold text-foreground" : "text-muted-foreground font-medium"
                      )}>
                        {product.unitsSold.toLocaleString()} {product.unitsSold === 1 ? "unit" : "units"}
                      </span>
                      <span className={cn(
                        sortBy === "revenue" ? "font-bold text-foreground" : "text-muted-foreground font-medium"
                      )}>
                        {formatIndianCurrency(product.netRevenue)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold bg-muted/60 dark:bg-muted/30 px-1.5 py-0.5 rounded-sm">
                        {product.percentOfTotal.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Proportional horizontal progress bar */}
                  <div className="h-1.5 w-full bg-muted/40 dark:bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        product.rank === 1 && "bg-emerald-500",
                        product.rank === 2 && "bg-indigo-500",
                        product.rank === 3 && "bg-violet-500",
                        product.rank > 3 && "bg-primary"
                      )}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
