"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FilterPill {
  id: string;
  label: string;
}

interface FilterPillsProps {
  pills: FilterPill[];
  onRemove: (id: string) => void;
}

export function FilterPills({ pills, onRemove }: FilterPillsProps) {
  if (!pills || pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {pills.map((pill) => (
        <Badge
          key={pill.id}
          variant="secondary"
          className="pl-3 pr-1 py-1 h-7 flex items-center gap-1.5 text-xs font-normal"
        >
          {pill.label}
          <button
            type="button"
            onClick={() => onRemove(pill.id)}
            className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove filter {pill.label}</span>
          </button>
        </Badge>
      ))}
    </div>
  );
}
