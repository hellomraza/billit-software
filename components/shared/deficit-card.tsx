import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { CheckCircle2, PackageMinus } from "lucide-react";
import { Product } from "@/types";

export interface DeficitGroup {
  productId: string;
  product?: Product;
  totalMissing: number;
  recordsCount: number;
  status: "PENDING" | "RESOLVED";
  lastUpdated: string;
}

interface DeficitCardProps {
  deficit: DeficitGroup;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onResolve?: () => void;
}

export function DeficitCard({ deficit, isExpanded, onToggleExpand, onResolve }: DeficitCardProps) {
  return (
    <Card className={deficit.status === "PENDING" ? "border-warning/50" : "opacity-80"}>
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex justify-between items-start gap-4">
          <StatusBadge 
            status={deficit.status === "PENDING" ? "warning" : "success"}
            variant="secondary"
            className="mb-2 shrink-0"
          >
            {deficit.status}
          </StatusBadge>
          <div className="flex gap-2">
            {deficit.status === "PENDING" && onResolve && (
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={onResolve}>
                Acknowledge Restock
              </Button>
            )}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight mt-1">{deficit.product?.name || "Unknown Product"}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex justify-between items-end border-t pt-3 border-dashed border-border/50">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Missing</div>
            <div className="flex items-center gap-1 text-foreground font-bold text-2xl">
              <PackageMinus className="h-5 w-5 text-warning" />
              {deficit.totalMissing}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">{deficit.recordsCount} total invoices</div>
            {onToggleExpand && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onToggleExpand}>
                {isExpanded ? "Hide details" : "View source invoices"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
