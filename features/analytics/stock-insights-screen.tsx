"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsTabBar } from "./analytics-tab-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, ChevronRight, AlertCircle } from "lucide-react";

interface LowStockProduct {
  productId: string;
  productName: string;
  currentStock: number;
  stockStatus: "NEGATIVE" | "OUT_OF_STOCK" | "LOW";
}

interface LowStockData {
  lowStockProducts: LowStockProduct[];
  count: number;
}

interface DeficitSummary {
  pendingProductCount: number;
  totalPendingQuantity: number;
  hasDeficits: boolean;
}

interface StockInsightsScreenProps {
  lowStockData: LowStockData;
  deficitSummary: DeficitSummary;
}

export function StockInsightsScreen({
  lowStockData,
  deficitSummary,
}: StockInsightsScreenProps) {
  const { lowStockProducts, count } = lowStockData;

  // Ensure products are sorted by currentStock ascending (NEGATIVE first, then OUT_OF_STOCK, then LOW)
  const sortedProducts = [...(lowStockProducts || [])].sort(
    (a, b) => a.currentStock - b.currentStock
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Insights"
        description="Monitor your inventory health, deficits, and sales analytics."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Analytics", href: "/analytics/stock" },
          { label: "Stock Insights" },
        ]}
      />

      <AnalyticsTabBar />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column - Low Stock Alerts */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <CardTitle>Low Stock Alerts</CardTitle>
                <Badge variant={count > 0 ? "destructive" : "secondary"}>
                  {count} {count === 1 ? "product" : "products"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {count === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-emerald-100 bg-emerald-50/50 rounded-xl p-6">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
                  <h3 className="font-semibold text-emerald-800 text-lg">
                    All products are well-stocked!
                  </h3>
                  <p className="text-sm text-emerald-700/80 mt-1 max-w-sm">
                    Nice! None of your active products are currently running low or out of stock.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedProducts.map((product) => (
                    <Link
                      key={product.productId}
                      href={`/products/${product.productId}/edit`}
                      className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-muted/50 hover:shadow-xs transition-all duration-200 group"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {product.productName}
                        </p>
                        <div className="flex gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block uppercase tracking-wider",
                              {
                                "bg-red-50 text-red-700 border border-red-200":
                                  product.stockStatus === "NEGATIVE",
                                "bg-rose-50 text-rose-700 border border-rose-200":
                                  product.stockStatus === "OUT_OF_STOCK",
                                "bg-amber-50 text-amber-700 border border-amber-200":
                                  product.stockStatus === "LOW",
                              }
                            )}
                          >
                            {product.stockStatus === "NEGATIVE" && "Negative Stock"}
                            {product.stockStatus === "OUT_OF_STOCK" && "Out of Stock"}
                            {product.stockStatus === "LOW" && "Low Stock"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span
                            className={cn("font-bold text-sm", {
                              "text-red-600":
                                product.stockStatus === "NEGATIVE" ||
                                product.stockStatus === "OUT_OF_STOCK",
                              "text-amber-600": product.stockStatus === "LOW",
                            })}
                          >
                            {product.currentStock}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {product.currentStock === 1 ? "unit" : "units"}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Placeholder for Product Health Section (US-06) */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle>Product Health Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed rounded-xl">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">Product Health categories loading...</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">
                  Fast Selling, Slow Selling, and Dead Stock insights will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Deficit Summary Placeholder (US-07) */}
        <div>
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle>Unresolved Deficits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed rounded-xl">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">Deficit summary widget loading...</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">
                  Pending stock discrepancy overview will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
