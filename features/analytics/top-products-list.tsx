"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatIndianCurrency } from "@/lib/utils/format";
import { Sparkles, PackageOpen } from "lucide-react";
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
}

interface TopProductsListProps {
  topProductsData: TopProductsData;
}

export function TopProductsList({ topProductsData }: TopProductsListProps) {
  const { topProducts } = topProductsData;

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <CardTitle className="text-base font-semibold">Top Performing Products</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
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
                      <span className="text-muted-foreground font-medium">
                        {product.unitsSold.toLocaleString()} {product.unitsSold === 1 ? "unit" : "units"}
                      </span>
                      <span className="font-bold text-foreground">
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
