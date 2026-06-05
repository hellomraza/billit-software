"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

interface DeficitSummary {
  pendingProductCount: number;
  totalPendingQuantity: number;
  hasDeficits: boolean;
}

interface DeficitSummaryWidgetProps {
  deficitSummary: DeficitSummary;
}

export function DeficitSummaryWidget({ deficitSummary }: DeficitSummaryWidgetProps) {
  const { pendingProductCount, totalPendingQuantity, hasDeficits } = deficitSummary;

  return (
    <Card
      className={cn(
        "transition-all duration-300 overflow-hidden border",
        hasDeficits
          ? "border-amber-200 bg-amber-50/10 shadow-sm"
          : "border-emerald-100 bg-emerald-50/10"
      )}
    >
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {hasDeficits ? (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          )}
          Unresolved Deficits
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {!hasDeficits ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
              No unresolved deficits.
            </p>
            <p className="text-xs text-muted-foreground">
              Stock records are perfectly consistent across the system.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs border bg-background/50 rounded-lg p-3">
                <span className="text-muted-foreground font-medium">Deficit Products</span>
                <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                  {pendingProductCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border bg-background/50 rounded-lg p-3">
                <span className="text-muted-foreground font-medium">Total Units Deficit</span>
                <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                  {totalPendingQuantity}
                </span>
              </div>
            </div>

            <Link
              href="/deficits"
              className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-all duration-200 group"
            >
              <span>Manage deficits</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
