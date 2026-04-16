"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import {
  InvoiceFilters,
  InvoiceFiltersState,
} from "@/features/invoices/invoice-filters";
import { InvoiceTable } from "@/features/invoices/invoice-table";
import { getInvoices } from "@/lib/mock-data/invoice";
import { ROUTES } from "@/lib/routes";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    getInvoices().then(setInvoices);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<InvoiceFiltersState>({
    paymentMethod: "",
    isGst: "",
    startDate: "",
    endDate: ""
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!inv.invoiceNumber.toLowerCase().includes(query) && 
            !inv.customerName?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Exact Filters
      if (filters.paymentMethod && inv.paymentMethod !== filters.paymentMethod) return false;
      if (filters.isGst !== undefined && filters.isGst !== "") {
        const wantsGst = filters.isGst === "true";
        if (inv.isGstInvoice !== wantsGst) return false;
      }

      // 3. Date Restrictions
      const invDate = new Date(inv.date).getTime();
      if (filters.startDate) {
        if (invDate < new Date(filters.startDate).getTime()) return false;
      }
      if (filters.endDate) {
        // End date should include the full day up to 23:59:59
        const eDate = new Date(filters.endDate);
        eDate.setHours(23, 59, 59, 999);
        if (invDate > eDate.getTime()) return false;
      }

      return true;
    });
  }, [invoices, filters, searchQuery]);

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-[1400px] mx-auto">
      <PageHeader title="Invoices" />

      <div className="flex flex-col gap-4">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search invoice number or customer..."
          className="w-full max-w-sm"
        />
        <InvoiceFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={() => setFilters({ paymentMethod: "", isGst: "", startDate: "", endDate: "" })}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Invoices Found"
            description="No invoices match your current search or filter criteria."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery("");
              setFilters({ paymentMethod: "", isGst: "", startDate: "", endDate: "" });
            }}
          />
        ) : (
          <InvoiceTable
            invoices={filteredInvoices}
            filters={filters}
            searchQuery={searchQuery}
            onSelectInvoice={(inv) => router.push(ROUTES.INVOICE_DETAIL(inv.id))}
          />
        )}
      </div>
    </div>
  );
}
