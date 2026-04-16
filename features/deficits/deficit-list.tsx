"use client";

import { DeficitCard, DeficitGroup } from "@/components/shared/deficit-card";
import { DeficitRecord } from "@/types";
import { useState } from "react";
import { DeficitExpanded } from "./deficit-expanded";

interface DeficitListProps {
  deficits: DeficitGroup[];
  recordsByGroup: Record<string, DeficitRecord[]>;
  onResolve: (productId: string, totalMissing: number) => void;
}

export function DeficitList({
  deficits,
  recordsByGroup,
  onResolve,
}: DeficitListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

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
