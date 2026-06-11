"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/constants/defaults";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useInvoiceFiltersStore } from "@/stores/invoice-filters-store";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export function InvoiceFiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(() => {
    return !!(
      searchParams.get("dateFrom") ||
      searchParams.get("dateTo") ||
      searchParams.get("productId")
    );
  });

  const invoiceFiltersBar = useInvoiceFiltersStore(
    (state) => state.invoiceFiltersBar,
  );
  const {
    setInvoiceFiltersBar,
    mergeInvoiceFiltersBar,
    resetInvoiceFiltersBar,
  } = useInvoiceFiltersStore((state) => state.actions);

  const invoiceNumber = invoiceFiltersBar.invoiceNumber || "";
  const paymentMethod = invoiceFiltersBar.paymentMethod || "";
  const gstEnabled = invoiceFiltersBar.gstEnabled || "";
  const dateFrom = invoiceFiltersBar.dateFrom || "";
  const dateTo = invoiceFiltersBar.dateTo || "";
  const productId = invoiceFiltersBar.productId || "";
  const invoiceType = invoiceFiltersBar.invoiceType || "";
  const customerName = invoiceFiltersBar.customerName || "";
  const customerPhone = invoiceFiltersBar.customerPhone || "";

  useEffect(() => {
    setInvoiceFiltersBar({
      invoiceNumber: searchParams.get("invoiceNumber") || "",
      paymentMethod: searchParams.get("paymentMethod") || "",
      gstEnabled: searchParams.get("gstEnabled") || "",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
      productId: searchParams.get("productId") || "",
      invoiceType: searchParams.get("invoiceType") || "",
      customerName: searchParams.get("customerName") || "",
      customerPhone: searchParams.get("customerPhone") || "",
    });
  }, [searchParams, setInvoiceFiltersBar]);

  const debouncedInvoiceNumber = useDebouncedValue(invoiceNumber, 300);
  const debouncedProductId = useDebouncedValue(productId, 300);
  const debouncedCustomerName = useDebouncedValue(customerName, 300);
  const debouncedCustomerPhone = useDebouncedValue(customerPhone, 300);

  // Update URL params whenever filters change
  const updateParams = useCallback(
    (updatedFilters: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Handle debounced changes via useEffect to automatically search
  useEffect(() => {
    const currentParam = searchParams.get("invoiceNumber") || "";
    if (debouncedInvoiceNumber !== currentParam) {
      updateParams({ invoiceNumber: debouncedInvoiceNumber || undefined });
    }
  }, [debouncedInvoiceNumber, updateParams, searchParams]);

  useEffect(() => {
    const currentParam = searchParams.get("productId") || "";
    if (debouncedProductId !== currentParam) {
      updateParams({ productId: debouncedProductId || undefined });
    }
  }, [debouncedProductId, updateParams, searchParams]);

  useEffect(() => {
    const currentParam = searchParams.get("customerName") || "";
    if (debouncedCustomerName !== currentParam) {
      updateParams({ customerName: debouncedCustomerName || undefined });
    }
  }, [debouncedCustomerName, updateParams, searchParams]);

  useEffect(() => {
    const currentParam = searchParams.get("customerPhone") || "";
    if (debouncedCustomerPhone !== currentParam) {
      updateParams({ customerPhone: debouncedCustomerPhone || undefined });
    }
  }, [debouncedCustomerPhone, updateParams, searchParams]);

  const handlePaymentMethodChange = (value: string | null) => {
    if (!value || value === "ALL") {
      mergeInvoiceFiltersBar({ paymentMethod: "" });
      updateParams({ paymentMethod: undefined });
      return;
    }
    mergeInvoiceFiltersBar({ paymentMethod: value });
    updateParams({ paymentMethod: value || undefined });
  };

  const handleGstEnabledChange = (value: string | null) => {
    if (!value || value === "ALL") {
      mergeInvoiceFiltersBar({ gstEnabled: "" });
      updateParams({ gstEnabled: undefined });
      return;
    }
    mergeInvoiceFiltersBar({ gstEnabled: value });
    updateParams({ gstEnabled: value || undefined });
  };

  const handleDateFromChange = (value: string) => {
    mergeInvoiceFiltersBar({ dateFrom: value });
    updateParams({ dateFrom: value || undefined });
  };

  const handleDateToChange = (value: string) => {
    mergeInvoiceFiltersBar({ dateTo: value });
    updateParams({ dateTo: value || undefined });
  };

  const handleInvoiceTypeChange = (value: string | null) => {
    if (!value || value === "ALL") {
      mergeInvoiceFiltersBar({ invoiceType: "" });
      updateParams({ invoiceType: undefined });
      return;
    }

    mergeInvoiceFiltersBar({ invoiceType: value });
    updateParams({ invoiceType: value });
  };

  const handleReset = () => {
    resetInvoiceFiltersBar();
    router.push("?page=1");
  };

  const hasActiveFilters =
    invoiceNumber ||
    paymentMethod ||
    gstEnabled ||
    dateFrom ||
    dateTo ||
    productId ||
    invoiceType ||
    customerName ||
    customerPhone;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Invoice Number Search */}
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            placeholder="Search invoice #..."
            value={invoiceNumber}
            onChange={(e) => {
              mergeInvoiceFiltersBar({ invoiceNumber: e.target.value });
            }}
            className="h-10"
          />
        </div>

        {/* Customer Name */}
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input
            id="customerName"
            placeholder="Search customer name..."
            value={customerName}
            onChange={(e) => {
              mergeInvoiceFiltersBar({ customerName: e.target.value });
            }}
            className="h-10"
          />
        </div>

        {/* Customer Phone */}
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Mobile Number</Label>
          <Input
            id="customerPhone"
            placeholder="Search mobile number..."
            value={customerPhone}
            onChange={(e) => {
              mergeInvoiceFiltersBar({ customerPhone: e.target.value });
            }}
            className="h-10"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            value={paymentMethod || "ALL"}
            onValueChange={handlePaymentMethodChange}
          >
            <SelectTrigger id="paymentMethod" className="h-10">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All methods</SelectItem>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* GST Type */}
        <div className="space-y-2">
          <Label htmlFor="gstEnabled">GST Type</Label>
          <Select value={gstEnabled || "ALL"} onValueChange={handleGstEnabledChange}>
            <SelectTrigger id="gstEnabled" className="h-10">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="true">GST Invoices</SelectItem>
              <SelectItem value="false">Non-GST Invoices</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Type */}
        <div className="space-y-2">
          <Label htmlFor="invoiceType">Invoice Type</Label>
          <Select value={invoiceType} onValueChange={handleInvoiceTypeChange}>
            <SelectTrigger id="invoiceType" className="h-10">
              <SelectValue placeholder="All invoices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="SALE">Sales only</SelectItem>
              <SelectItem value="REFUND">Refunds only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
        <div className="flex items-center">
          <CollapsibleTrigger
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 h-8 rounded-lg border border-dashed border-border/60 transition-colors"
          >
            {isOpen ? (
              <>
                <span>Hide Advanced Filters</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Show Advanced Filters</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-dashed border-border/50">
            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Product Search */}
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                placeholder="Search product..."
                value={productId}
                onChange={(e) => {
                  mergeInvoiceFiltersBar({ productId: e.target.value });
                }}
                className="h-10"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {hasActiveFilters && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
