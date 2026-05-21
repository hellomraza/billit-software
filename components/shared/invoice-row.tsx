import React from "react";
import { Invoice } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyText } from "@/components/shared/money-text";
import { formatDateTime } from "@/lib/formatters/date";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex items-center gap-2">
          <span>{invoice.invoiceNumber}</span>
          {invoice.invoiceType === "REFUND" ? (
            <Badge className="h-5 border-rose-200 bg-rose-50 text-rose-700">
              Refund
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums text-xs">
        {formatDateTime(invoice.createdAt)}
      </TableCell>
      <TableCell className="truncate max-w-37.5">
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
        <MoneyText
          amount={
            invoice.invoiceType === "REFUND"
              ? -Math.abs(invoice.grandTotal)
              : invoice.grandTotal
          }
          className={invoice.invoiceType === "REFUND" ? "text-rose-600" : ""}
        />
      </TableCell>
    </TableRow>
  );
}
