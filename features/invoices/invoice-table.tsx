"use client";

import { DataTable } from "@/components/shared/data-table";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/formatters/date";
import { Invoice } from "@/types";

interface InvoiceTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  isLoading?: boolean;
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
  isLoading,
}: InvoiceTableProps) {
  return (
    <DataTable
      data={invoices}
      onRowClick={onSelectInvoice}
      isLoading={isLoading}
      columns={[
        {
          id: "invoiceNumber",
          header: "Invoice #",
          cell: (row) => (
            <span className="font-medium text-primary tabular-nums">
              {row.invoiceNumber}
            </span>
          ),
        },
        {
          id: "date",
          header: "Date",
          cell: (row) => (
            <span className="text-muted-foreground tabular-nums text-sm">
              {formatDateTime(row.createdAt)}
            </span>
          ),
        },
        {
          id: "customer",
          header: "Customer",
          cell: (row) => (
            <span className="truncate max-w-[150px] inline-block">
              {row.customerName || "Walk-in Customer"}
            </span>
          ),
        },
        {
          id: "payment",
          header: "Payment",
          cell: (row) => (
            <StatusBadge
              status="default"
              variant="outline"
              className="text-[10px]"
            >
              {row.paymentMethod}
            </StatusBadge>
          ),
        },
        {
          id: "tax",
          header: "Tax Type",
          cell: (row) =>
            row.isGstInvoice ? (
              <StatusBadge
                status="info"
                variant="secondary"
                className="text-[10px]"
              >
                GST
              </StatusBadge>
            ) : (
              <span className="text-muted-foreground text-xs font-mono">
                NON-GST
              </span>
            ),
        },
        {
          id: "total",
          header: "Total",
          align: "right",
          cell: (row) => (
            <MoneyText amount={row.grandTotal} className="font-semibold" />
          ),
        },
      ]}
    />
  );
}
