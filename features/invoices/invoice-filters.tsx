"use client";

import { FilterBar, FilterDefinition } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS } from "@/lib/constants/defaults";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export interface InvoiceFiltersState {
  paymentMethod?: string;
  isGst?: boolean | string;
  startDate?: string;
  endDate?: string;
  productName?: string;
}

interface InvoiceFiltersProps {
  filters: InvoiceFiltersState;
  onFilterChange: (filters: InvoiceFiltersState) => void;
  onReset: () => void;
}

const FILTER_DEF: FilterDefinition[] = [
  {
    id: "paymentMethod",
    label: "Payment Method",
    type: "select",
    options: PAYMENT_METHODS.map((m) => ({ label: m, value: m })),
  },
  {
    id: "isGst",
    label: "GST Type",
    type: "select",
    options: [
      { label: "GST Invoices", value: "true" },
      { label: "Non-GST Invoices", value: "false" },
    ],
  },
];

type QuickFilterPill = "today" | "thisWeek" | "thisMonth" | null;

function getDateRange(type: QuickFilterPill) {
  if (!type) return { start: "", end: "" };

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );

  switch (type) {
    case "today":
      return {
        start: startOfDay.toISOString().split("T")[0],
        end: endOfDay.toISOString().split("T")[0],
      };
    case "thisWeek":
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return {
        start: startOfWeek.toISOString().split("T")[0],
        end: endOfWeek.toISOString().split("T")[0],
      };
    case "thisMonth":
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return {
        start: startOfMonth.toISOString().split("T")[0],
        end: endOfMonth.toISOString().split("T")[0],
      };
  }
}

export function InvoiceFilters({
  filters,
  onFilterChange,
  onReset,
}: InvoiceFiltersProps) {
  const [productSearchInput, setProductSearchInput] = useState(
    filters.productName || "",
  );
  const [selectedQuickFilter, setSelectedQuickFilter] =
    useState<QuickFilterPill>(null);
  const debouncedProductSearch = useDebouncedValue(productSearchInput, 300);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("billit_invoice_filters");
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      onFilterChange(parsed);

      // Determine which quick filter was selected based on dates
      if (parsed.startDate && parsed.endDate) {
        const range = getDateRange("today");
        if (parsed.startDate === range.start && parsed.endDate === range.end) {
          setSelectedQuickFilter("today");
        } else {
          const weekRange = getDateRange("thisWeek");
          if (
            parsed.startDate === weekRange.start &&
            parsed.endDate === weekRange.end
          ) {
            setSelectedQuickFilter("thisWeek");
          } else {
            const monthRange = getDateRange("thisMonth");
            if (
              parsed.startDate === monthRange.start &&
              parsed.endDate === monthRange.end
            ) {
              setSelectedQuickFilter("thisMonth");
            }
          }
        }
      }
    }
  }, []);

  // Sync debounced product search to filters
  useEffect(() => {
    onFilterChange({ ...filters, productName: debouncedProductSearch });
  }, [debouncedProductSearch]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("billit_invoice_filters", JSON.stringify(filters));
  }, [filters]);

  const handleFilterChange = (newFilters: Record<string, string | boolean>) => {
    onFilterChange({ ...filters, ...newFilters } as InvoiceFiltersState);
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setSelectedQuickFilter(null); // Clear quick filter when manually setting dates
    onFilterChange({ ...filters, [field]: value });
  };

  const handleProductChange = (value: string) => {
    setProductSearchInput(value);
  };

  const handleQuickFilter = (pill: QuickFilterPill) => {
    if (selectedQuickFilter === pill) {
      setSelectedQuickFilter(null);
      onFilterChange({ ...filters, startDate: "", endDate: "" });
    } else {
      const range = getDateRange(pill);
      setSelectedQuickFilter(pill);
      onFilterChange({
        ...filters,
        startDate: range.start,
        endDate: range.end,
      });
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.paymentMethod,
    filters.isGst,
    filters.startDate,
    filters.endDate,
    filters.productName,
  ].filter(Boolean).length;

  const handleReset = () => {
    setProductSearchInput("");
    setSelectedQuickFilter(null);
    localStorage.removeItem("billit_invoice_filters");
    onReset();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 border rounded-lg">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Quick Filter:
        </span>
        <Button
          variant={selectedQuickFilter === "today" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 px-3"
          onClick={() => handleQuickFilter("today")}
        >
          Today
        </Button>
        <Button
          variant={selectedQuickFilter === "thisWeek" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 px-3"
          onClick={() => handleQuickFilter("thisWeek")}
        >
          This Week
        </Button>
        <Button
          variant={selectedQuickFilter === "thisMonth" ? "default" : "outline"}
          size="sm"
          className="text-xs h-8 px-3"
          onClick={() => handleQuickFilter("thisMonth")}
        >
          This Month
        </Button>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/40 border rounded-lg">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            className="h-8 text-xs w-auto"
            value={filters.startDate || ""}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            className="h-8 text-xs w-auto"
            value={filters.endDate || ""}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Product</Label>
          <Input
            type="text"
            placeholder="Search products..."
            className="h-8 text-xs w-40"
            value={productSearchInput}
            onChange={(e) => handleProductChange(e.target.value)}
            aria-label="Search products by name"
          />
        </div>

        {/* Filter Count Badge and Clear Button */}
        <div className="ml-auto flex items-center gap-2">
          {activeFilterCount > 0 && (
            <div className="bg-primary text-primary-foreground text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center">
              {activeFilterCount}
            </div>
          )}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-2 gap-1"
              onClick={handleReset}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <FilterBar
        filters={FILTER_DEF}
        activeFilters={{
          paymentMethod: filters.paymentMethod || "",
          isGst: filters.isGst || "", // FilterBar expects simple strings/booleans
        }}
        onFilterChange={handleFilterChange}
        onReset={onReset}
      />
    </div>
  );
}
