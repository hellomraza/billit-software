"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import {
  InvoiceFilters,
  InvoiceFiltersState,
} from "@/features/invoices/invoice-filters";
import { InvoiceTable } from "@/features/invoices/invoice-table";
import { getInvoices } from "@/lib/mock-data/invoice";
import { ROUTES } from "@/lib/routes";
import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      setIsLoading(true);
      getInvoices()
        .then(setInvoices)
        .catch((error) => {
          toast.error("Failed to load invoices", {
            description: "Please try refreshing the page.",
          });
          console.error("Error loading invoices:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      toast.error("Error loading invoices", {
        description: "An unexpected error occurred.",
      });
      console.error("Error:", error);
      setIsLoading(false);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<InvoiceFiltersState>({
    paymentMethod: "",
    isGst: "",
    startDate: "",
    endDate: "",
    productName: "",
  });

  // Simulate search loading for 150ms after search query changes
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 150);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search Query (invoice number and customer)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !inv.invoiceNumber.toLowerCase().includes(query) &&
          !inv.customerName?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 2. Payment Method Filter
      if (filters.paymentMethod && inv.paymentMethod !== filters.paymentMethod)
        return false;

      // 3. GST Type Filter
      if (filters.isGst !== undefined && filters.isGst !== "") {
        const wantsGst = filters.isGst === "true";
        if (inv.isGstInvoice !== wantsGst) return false;
      }

      // 4. Product Name Filter (searches within invoice items)
      if (filters.productName) {
        const productQuery = filters.productName.toLowerCase();
        const hasProduct = inv.items.some((item: any) =>
          item.productName.toLowerCase().includes(productQuery),
        );
        if (!hasProduct) return false;
      }

      // 5. Date Range Filter
      const invDate = new Date(inv.createdAt).getTime();
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
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="animate-in slide-in-from-top duration-500 delay-100">
        <PageHeader title="Invoices" />
      </div>
      <div className="flex flex-col gap-4 animate-in slide-in-from-top duration-500 delay-150">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search invoice number or customer..."
          className="w-full max-w-sm"
          loading={isSearching}
        />
        <InvoiceFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={() =>
            setFilters({
              paymentMethod: "",
              isGst: "",
              startDate: "",
              endDate: "",
            })
          }
        />
      </div>
      <div className="flex-1 overflow-auto animate-in fade-in duration-500 delay-200">
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Invoices Found"
            description="No invoices match your current search or filter criteria."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery("");
              setFilters({
                paymentMethod: "",
                isGst: "",
                startDate: "",
                endDate: "",
                productName: "",
              });
            }}
          />
        ) : (
          <InvoiceTable
            invoices={filteredInvoices}
            onSelectInvoice={(inv) =>
              router.push(ROUTES.INVOICE_DETAIL(inv.id))
            }
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
