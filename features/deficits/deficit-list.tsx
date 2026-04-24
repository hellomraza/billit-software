"use client";

import { DeficitCard, DeficitGroup } from "@/components/shared/deficit-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeficitRecord } from "@/types";
import { useState } from "react";
import { DeficitExpanded } from "./deficit-expanded";

interface DeficitListProps {
  deficits: DeficitGroup[];
  recordsByGroup: Record<string, DeficitRecord[]>;
  onResolve: (productId: string, totalMissing: number) => void;
  onAdjust: (productId: string) => void;
  isLoading?: boolean;
}

export function DeficitList({
  deficits,
  recordsByGroup,
  onResolve,
  onAdjust,
  isLoading,
}: DeficitListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <Card
            key={`skeleton-${index}`}
            className="animate-in fade-in duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3 px-4 pt-4">
              <div className="flex justify-between items-start gap-4">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-8 w-32 rounded" />
              </div>
              <Skeleton className="h-6 w-40 rounded mt-3" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex justify-between items-end border-t pt-3 border-dashed border-border/50">
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 rounded mb-2" />
                  <Skeleton className="h-8 w-12 rounded" />
                </div>
                <div className="flex-1 text-right">
                  <Skeleton className="h-4 w-24 rounded mb-2 ml-auto" />
                  <Skeleton className="h-4 w-32 rounded ml-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (deficits.length === 0) return null;

  return (
    <div className="space-y-4">
      {deficits.map((deficit) => (
        <div key={deficit.productId} className="flex flex-col gap-2">
          <DeficitCard
            deficit={deficit}
            isExpanded={expandedId === deficit.productId}
            onToggleExpand={() => toggleExpand(deficit.productId)}
            onResolve={
              deficit.status === "PENDING"
                ? () => onResolve(deficit.productId, deficit.totalMissing)
                : undefined
            }
            onAdjust={
              deficit.status === "PENDING"
                ? () => onAdjust(deficit.productId)
                : undefined
            }
          />

          {expandedId === deficit.productId && (
            <div className="pl-4 border-l-2 border-primary/20 animate-in slide-in-from-top-4 fade-in duration-200">
              <DeficitExpanded
                records={recordsByGroup[deficit.productId] || []}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
