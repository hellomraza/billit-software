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
import { useEffect, useState } from "react";

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
  });

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
          onReset={() => setFilters({ paymentMethod: "", isGst: "" })}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Invoices Found"
            description="No invoices found. Create your first bill to get started."
            actionLabel="Go to Billing"
            onAction={() => router.push(ROUTES.BILLING)}
          />
        ) : (
          <InvoiceTable
            invoices={invoices}
            filters={filters}
            searchQuery={searchQuery}
            onSelectInvoice={(inv) => router.push(ROUTES.INVOICE_DETAIL(inv.id))}
          />
        )}
      </div>
    </div>
  );
}
