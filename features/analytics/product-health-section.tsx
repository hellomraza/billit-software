"use client";

import React, { useState, useEffect } from "react";
import clientAxios from "@/lib/axios/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, AlertTriangle, AlertOctagon, HelpCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type WindowSize = 7 | 30 | 90;

export interface ProductHealthItem {
  productId: string;
  productName: string;
  avgDailySales?: number;
  totalSoldInWindow?: number;
  daysSinceLastSale?: number;
  currentStock?: number;
}

export interface ProductHealthData {
  window: number;
  categoriesAvailable: boolean;
  insufficientReason: "INSUFFICIENT_PRODUCTS" | "INSUFFICIENT_DIFFERENTIATION" | null;
  fastSelling: ProductHealthItem[];
  slowSelling: ProductHealthItem[];
  deadStock: ProductHealthItem[];
  normal: ProductHealthItem[];
}

interface ProductHealthSectionProps {
  tenantId: string;
  initialData: ProductHealthData;
}

export function ProductHealthSection({
  tenantId,
  initialData,
}: ProductHealthSectionProps) {
  const [window, setWindow] = useState<WindowSize>(30);
  const [data, setData] = useState<ProductHealthData>(initialData);
  const [loading, setLoading] = useState(false);
  const [showNormal, setShowNormal] = useState(false);

  useEffect(() => {
    if (window === 30) {
      setData(initialData);
      return;
    }

    setLoading(true);
    clientAxios
      .get(`/tenants/${tenantId}/analytics/product-health?window=${window}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch product health data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [window, tenantId, initialData]);

  const { categoriesAvailable, insufficientReason, fastSelling, slowSelling, deadStock, normal } = data;

  return (
    <Card className="relative overflow-hidden">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-xs">
          <div className="flex items-center gap-2 bg-card p-3 rounded-lg border shadow-md font-medium text-sm text-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Updating insights...
          </div>
        </div>
      )}

      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Product Performance Health
        </CardTitle>

        {/* Time Window Selector segmented control */}
        <div className="flex rounded-lg border bg-muted p-0.5 text-xs select-none">
          {([7, 30, 90] as WindowSize[]).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                window === w
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {w} Days
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {!categoriesAvailable ? (
          /* Insufficient Data State */
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl p-6 bg-muted/20">
            {insufficientReason === "INSUFFICIENT_PRODUCTS" ? (
              <>
                <AlertCircleIcon className="h-10 w-10 text-muted-foreground/80 mb-3" />
                <h4 className="font-semibold text-foreground text-base">Insufficient Products</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Not enough sales data to categorize products. Categories appear once you have sales data for 5 or more products.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
                <h4 className="font-semibold text-foreground text-base">Insufficient Differentiation</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Your products sell at a similar rate — no meaningful fast/slow distinction yet.
                </p>
              </>
            )}
          </div>
        ) : (
          /* Category Lists */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fast Selling Column */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/10 p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-emerald-100/50 pb-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <h4 className="font-semibold text-emerald-800 text-sm uppercase tracking-wider">Fast Selling</h4>
                  <span className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5 ml-auto font-medium">
                    {fastSelling.length}
                  </span>
                </div>
                {fastSelling.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No fast selling products in this window.</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
                    {fastSelling.map((item) => (
                      <div key={item.productId} className="bg-background border rounded-lg p-3 text-xs space-y-1">
                        <p className="font-semibold text-foreground">{item.productName}</p>
                        <div className="flex items-center justify-between text-muted-foreground pt-1">
                          <span>Avg: <strong className="text-emerald-700">{(item.avgDailySales || 0).toFixed(1)}/day</strong></span>
                          <span>Total: <strong>{item.totalSoldInWindow || 0} units</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Slow Selling Column */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/10 p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100/50 pb-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                  <h4 className="font-semibold text-amber-800 text-sm uppercase tracking-wider">Slow Selling</h4>
                  <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 ml-auto font-medium">
                    {slowSelling.length}
                  </span>
                </div>
                {slowSelling.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No slow selling products in this window.</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
                    {slowSelling.map((item) => (
                      <div key={item.productId} className="bg-background border rounded-lg p-3 text-xs space-y-1">
                        <p className="font-semibold text-foreground">{item.productName}</p>
                        <div className="flex items-center justify-between text-muted-foreground pt-1">
                          <span>Avg: <strong className="text-amber-700">{(item.avgDailySales || 0).toFixed(1)}/day</strong></span>
                          <span>Last sold: <strong>{item.daysSinceLastSale === 0 ? "Today" : `${item.daysSinceLastSale}d ago`}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dead Stock Column */}
              <div className="rounded-xl border border-red-100 bg-red-50/10 p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-red-100/50 pb-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  <h4 className="font-semibold text-red-800 text-sm uppercase tracking-wider">Dead Stock</h4>
                  <span className="text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5 ml-auto font-medium">
                    {deadStock.length}
                  </span>
                </div>
                {deadStock.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No dead stock products detected.</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
                    {deadStock.map((item) => (
                      <div key={item.productId} className="bg-background border rounded-lg p-3 text-xs space-y-1">
                        <p className="font-semibold text-foreground">{item.productName}</p>
                        <div className="flex items-center justify-between text-muted-foreground pt-1">
                          <span>Unsold: <strong className="text-red-700">{item.daysSinceLastSale || 0} days</strong></span>
                          <span>Stock: <strong>{item.currentStock || 0} units</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Normal Products Expandable Section */}
            {normal && normal.length > 0 && (
              <div className="border rounded-xl">
                <Button
                  variant="ghost"
                  onClick={() => setShowNormal(!showNormal)}
                  className="w-full flex items-center justify-between px-4 py-3 h-auto text-sm text-foreground hover:bg-muted/50 rounded-xl"
                >
                  <span className="font-medium flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Show all {normal.length} normal products
                  </span>
                  {showNormal ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </Button>

                {showNormal && (
                  <div className="px-4 pb-4 pt-2 border-t bg-muted/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto rounded-b-xl no-scrollbar">
                    {normal.map((item) => (
                      <div key={item.productId} className="bg-background border rounded-lg p-3 text-xs flex justify-between items-center">
                        <span className="font-medium text-foreground truncate max-w-[70%]">{item.productName}</span>
                        <span className="text-muted-foreground font-semibold shrink-0">
                          {(item.avgDailySales || 0).toFixed(1)}/day
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-muted rounded-full p-2", className)}>
      <AlertOctagon className="h-full w-full" />
    </div>
  );
}
