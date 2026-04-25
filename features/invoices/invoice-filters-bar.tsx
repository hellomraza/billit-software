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
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function InvoiceFiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [invoiceNumber, setInvoiceNumber] = useState(
    searchParams.get("invoiceNumber") || "",
  );
  const [paymentMethod, setPaymentMethod] = useState(
    searchParams.get("paymentMethod") || "",
  );
  const [gstEnabled, setGstEnabled] = useState(
    searchParams.get("gstEnabled") || "",
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [productId, setProductId] = useState(
    searchParams.get("productId") || "",
  );

  const debouncedInvoiceNumber = useDebouncedValue(invoiceNumber, 300);
  const debouncedProductId = useDebouncedValue(productId, 300);

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

  // Handle debounced changes
  const handleInvoiceNumberChange = useCallback(() => {
    updateParams({ invoiceNumber: debouncedInvoiceNumber || undefined });
  }, [debouncedInvoiceNumber, updateParams]);

  const handleProductIdChange = useCallback(() => {
    updateParams({ productId: debouncedProductId || undefined });
  }, [debouncedProductId, updateParams]);

  const handlePaymentMethodChange = (value: string | null) => {
    if (!value) {
      setPaymentMethod("");
      updateParams({ paymentMethod: undefined });
      return;
    }
    setPaymentMethod(value);
    updateParams({ paymentMethod: value || undefined });
  };

  const handleGstEnabledChange = (value: string | null) => {
    if (!value) {
      setGstEnabled("");
      updateParams({ gstEnabled: undefined });
      return;
    }
    setGstEnabled(value);
    updateParams({ gstEnabled: value || undefined });
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    updateParams({ dateFrom: value || undefined });
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    updateParams({ dateTo: value || undefined });
  };

  const handleReset = () => {
    setInvoiceNumber("");
    setPaymentMethod("");
    setGstEnabled("");
    setDateFrom("");
    setDateTo("");
    setProductId("");
    router.push("?page=1");
  };

  const hasActiveFilters =
    invoiceNumber ||
    paymentMethod ||
    gstEnabled ||
    dateFrom ||
    dateTo ||
    productId;

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
              setInvoiceNumber(e.target.value);
            }}
            onBlur={handleInvoiceNumberChange}
            className="h-10"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            value={paymentMethod}
            onValueChange={handlePaymentMethodChange}
          >
            <SelectTrigger id="paymentMethod" className="h-10">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
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
          <Select value={gstEnabled} onValueChange={handleGstEnabledChange}>
            <SelectTrigger id="gstEnabled" className="h-10">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">GST Invoices</SelectItem>
              <SelectItem value="false">Non-GST Invoices</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
              setProductId(e.target.value);
            }}
            onBlur={handleProductIdChange}
            className="h-10"
          />
        </div>
      </div>

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
