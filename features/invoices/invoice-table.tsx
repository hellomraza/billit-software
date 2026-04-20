"use client";

import { DataTable } from "@/components/shared/data-table";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatters/date";
import { Invoice } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onSelectInvoice?: (invoice: Invoice) => void;
  isLoading?: boolean;
  pagination?: PaginationInfo;
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
  isLoading,
  pagination,
}: InvoiceTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 1;
  const currentPage = pagination?.page || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleRowClick = (invoice: Invoice) => {
    if (onSelectInvoice) {
      onSelectInvoice(invoice);
    }
  };

  return (
    <div className="space-y-4">
      <DataTable
        data={invoices}
        onRowClick={handleRowClick}
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

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
