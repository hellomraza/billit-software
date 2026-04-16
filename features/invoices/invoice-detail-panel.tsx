"use client";

import { MoneyText } from "@/components/shared/money-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InvoiceItemsTable } from "@/features/billing/invoice-items-table";
import { formatDateTime } from "@/lib/formatters/date";
import { Invoice } from "@/types";

interface InvoiceDetailPanelProps {
  invoice: Invoice;
}

export function InvoiceDetailPanel({ invoice }: InvoiceDetailPanelProps) {
  return (
    <div className="space-y-6 invoice-details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="animate-in fade-in slide-in-from-left duration-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Invoice Number</span>
              <span className="text-sm font-mono text-primary font-bold">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Date & Time</span>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(invoice.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Payment Method</span>
              <span className="text-sm uppercase">{invoice.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Tax Type</span>
              <span className="text-sm">
                {invoice.isGstInvoice ? "GST Registered" : "Non-GST"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-right duration-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoice.customerName ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm">{invoice.customerName}</span>
                </div>
                {invoice.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Phone</span>
                    <span className="text-sm">{invoice.customerPhone}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground py-2 italic text-center">
                Walk-in Customer (No details collected)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-in fade-in slide-in-from-top duration-500 delay-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
            Itemized Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0 invoice-items-table">
          <InvoiceItemsTable
            items={invoice.items}
            showGst={invoice.isGstInvoice}
          />
        </CardContent>
      </Card>

      <Card className="bg-muted/10 border-dashed animate-in fade-in slide-in-from-bottom duration-500 delay-150 grand-total-section invoice-summary">
        <CardContent className="p-6">
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <MoneyText amount={invoice.subtotal} />
            </div>
            {invoice.isGstInvoice && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total GST</span>
                <MoneyText amount={invoice.totalGst} />
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between items-center grand-total">
              <span className="font-semibold text-lg">Grand Total</span>
              <MoneyText
                amount={invoice.grandTotal}
                className="text-2xl font-bold text-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
