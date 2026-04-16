"use client";

import { DataTable } from "@/components/shared/data-table";
import { formatDateTime } from "@/lib/formatters/date";
import { ROUTES } from "@/lib/routes";
import { DeficitRecord } from "@/types";
import Link from "next/link";

interface DeficitExpandedProps {
  records: DeficitRecord[];
}

export function DeficitExpanded({ records }: DeficitExpandedProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 border animate-in slide-in-from-top-4 fade-in duration-300">
      <DataTable
        data={records}
        columns={[
          {
            id: "date",
            header: "Occurrence Date",
            cell: (row) => (
              <span className="text-sm">{formatDateTime(row.createdAt)}</span>
            ),
          },
          {
            id: "missing",
            header: "Missing Qty",
            cell: (row) => (
              <span className="font-semibold text-warning">
                -{row.missingQuantity}
              </span>
            ),
          },
          {
            id: "invoice",
            header: "Source Invoice",
            cell: (row) => (
              <Link
                href={ROUTES.INVOICE_DETAIL(row.invoiceId)}
                className="text-primary hover:underline text-sm font-mono"
              >
                {row.invoiceId}
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
