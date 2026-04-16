"use client";

import { FilterBar, FilterDefinition } from "@/components/shared/filter-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_METHODS } from "@/lib/constants/defaults";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
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

export function InvoiceFilters({
  filters,
  onFilterChange,
  onReset,
}: InvoiceFiltersProps) {
  const [productSearchInput, setProductSearchInput] = useState(
    filters.productName || "",
  );
  const debouncedProductSearch = useDebouncedValue(productSearchInput, 300);

  // Sync debounced product search to filters
  useEffect(() => {
    onFilterChange({ ...filters, productName: debouncedProductSearch });
  }, [debouncedProductSearch]);

  const handleFilterChange = (newFilters: Record<string, string | boolean>) => {
    onFilterChange({ ...filters, ...newFilters } as InvoiceFiltersState);
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleProductChange = (value: string) => {
    setProductSearchInput(value);
  };

  return (
    <div className="flex flex-col gap-3">
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
