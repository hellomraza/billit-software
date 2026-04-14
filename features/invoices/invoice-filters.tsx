"use client";

import React from "react";
import { FilterBar, FilterDefinition } from "@/components/shared/filter-bar";
import { PAYMENT_METHODS } from "@/lib/constants/defaults";

export interface InvoiceFiltersState {
  paymentMethod?: string;
  isGst?: boolean | string;
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
    options: PAYMENT_METHODS.map(m => ({ label: m, value: m }))
  },
  {
    id: "isGst",
    label: "GST Type",
    type: "select",
    options: [
      { label: "GST Invoices", value: "true" },
      { label: "Non-GST Invoices", value: "false" }
    ]
  }
];

export function InvoiceFilters({ filters, onFilterChange, onReset }: InvoiceFiltersProps) {
  const handleFilterChange = (newFilters: Record<string, string | boolean>) => {
    onFilterChange(newFilters as InvoiceFiltersState);
  };

  return (
    <FilterBar 
      filters={FILTER_DEF}
      activeFilters={filters as any}
      onFilterChange={handleFilterChange}
      onReset={onReset}
    />
  );
}
