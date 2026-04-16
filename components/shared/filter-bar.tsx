"use client";

import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Trash2 } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: "select" | "toggle";
  options?: FilterOption[];
}

interface FilterBarProps {
  filters: FilterDefinition[];
  activeFilters: Record<string, string | boolean>;
  onFilterChange: (filters: Record<string, string | boolean>) => void;
  onReset: () => void;
}

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onReset,
}: FilterBarProps) {
  const handleSelectChange = (id: string, value: string) => {
    onFilterChange({ ...activeFilters, [id]: value });
  };

  const handleToggleChange = (id: string) => {
    const currentState = !!activeFilters[id];
    onFilterChange({ ...activeFilters, [id]: !currentState });
  };

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 border rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pr-2 border-r">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </div>

      {filters.map((filter) => {
        if (filter.type === "toggle") {
          const isActive = !!activeFilters[filter.id];
          return (
            <Button
              key={filter.id}
              variant={isActive ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleToggleChange(filter.id)}
              className="text-xs h-8"
            >
              {filter.label}
            </Button>
          );
        }

        if (filter.type === "select" && filter.options) {
          return (
            <select
              key={filter.id}
              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              value={(activeFilters[filter.id] as string) || ""}
              onChange={(e) => handleSelectChange(filter.id, e.target.value)}
            >
              <option value="">{filter.label} (All)</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }

        return null;
      })}

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
