import React from "react";
import { InvoiceItem } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoneyText } from "@/components/shared/money-text";

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  showGst: boolean;
}

export function InvoiceItemsTable({ items, showGst }: InvoiceItemsTableProps) {
  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[40%]">Item</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            {showGst && <TableHead className="text-right">GST</TableHead>}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-sm">
                {item.productName}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                <MoneyText amount={item.unitPrice} />
              </TableCell>
              <TableCell className="text-center font-medium">
                x{item.quantity}
              </TableCell>
              {showGst && (
                <TableCell className="text-right text-muted-foreground text-sm">
                  {item.gstRate}%
                </TableCell>
              )}
              <TableCell className="text-right font-medium tabular-nums">
                <MoneyText amount={item.subtotal} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
