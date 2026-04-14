import React from "react";
import { Invoice } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyText } from "@/components/shared/money-text";
import { formatDateTime } from "@/lib/formatters/date";

interface InvoiceRowProps {
  invoice: Invoice;
  onClick?: () => void;
}

export function InvoiceRow({ invoice, onClick }: InvoiceRowProps) {
  return (
    <TableRow 
      onClick={onClick}
      className={onClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
    >
      <TableCell className="font-medium text-primary tabular-nums">
        {invoice.invoiceNumber}
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums text-xs">
        {formatDateTime(invoice.createdAt)}
      </TableCell>
      <TableCell className="truncate max-w-[150px]">
        {invoice.customerName || "Walk-in Customer"}
      </TableCell>
      <TableCell>
        <StatusBadge status="default" variant="outline" className="text-[10px]">
          {invoice.paymentMethod}
        </StatusBadge>
      </TableCell>
      <TableCell>
        {invoice.isGstInvoice ? (
          <StatusBadge status="info" variant="secondary" className="text-[10px]">GST</StatusBadge>
        ) : (
          <span className="text-muted-foreground text-xs font-mono">NON-GST</span>
        )}
      </TableCell>
      <TableCell className="text-right bg-muted/10 font-medium">
        <MoneyText amount={invoice.grandTotal} />
      </TableCell>
    </TableRow>
  );
}
