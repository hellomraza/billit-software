"use client";

import React, { useMemo } from "react";
import { Invoice } from "@/types";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyText } from "@/components/shared/money-text";
import { formatDateTime } from "@/lib/formatters/date";
import { InvoiceFiltersState } from "./invoice-filters";

interface InvoiceTableProps {
  invoices: Invoice[];
  filters: InvoiceFiltersState;
  searchQuery: string;
  onSelectInvoice: (invoice: Invoice) => void;
}

export function InvoiceTable({ invoices, filters, searchQuery, onSelectInvoice }: InvoiceTableProps) {
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const numMatch = inv.invoiceNumber.toLowerCase().includes(q);
        const nameMatch = inv.customerName?.toLowerCase().includes(q);
        if (!numMatch && !nameMatch) return false;
      }

      // Filters
      if (filters.paymentMethod && inv.paymentMethod !== filters.paymentMethod) return false;
      if (filters.isGst !== undefined && filters.isGst !== "") {
        const wantsGst = filters.isGst === "true";
        if (inv.isGstInvoice !== wantsGst) return false;
      }

      return true;
    });
  }, [invoices, filters, searchQuery]);

  return (
    <DataTable
      data={filteredInvoices}
      onRowClick={onSelectInvoice}
      columns={[
        {
          id: "invoiceNumber",
          header: "Invoice #",
          cell: (row) => <span className="font-medium text-primary tabular-nums">{row.invoiceNumber}</span>
        },
        {
          id: "date",
          header: "Date",
          cell: (row) => <span className="text-muted-foreground tabular-nums text-sm">{formatDateTime(row.createdAt)}</span>
        },
        {
          id: "customer",
          header: "Customer",
          cell: (row) => <span className="truncate max-w-[150px] inline-block">{row.customerName || "Walk-in Customer"}</span>
        },
        {
          id: "payment",
          header: "Payment",
          cell: (row) => (
            <StatusBadge status="default" variant="outline" className="text-[10px]">
              {row.paymentMethod}
            </StatusBadge>
          )
        },
        {
          id: "tax",
          header: "Tax Type",
          cell: (row) => row.isGstInvoice 
            ? <StatusBadge status="info" variant="secondary" className="text-[10px]">GST</StatusBadge>
            : <span className="text-muted-foreground text-xs font-mono">NON-GST</span>
        },
        {
          id: "total",
          header: "Total",
          align: "right",
          cell: (row) => <MoneyText amount={row.grandTotal} className="font-semibold" />
        }
      ]}
    />
  );
}
