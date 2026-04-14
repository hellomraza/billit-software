import React from "react";
import { getInvoices } from "@/lib/mock-data/invoice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoneyText } from "@/components/shared/money-text";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Invoices | BillIt" };

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground text-sm">View and search historical sales records.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoice number..." className="pl-9 bg-card" />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        {invoices.length === 0 ? (
          <EmptyState 
            icon={FileText} 
            title="No invoices found" 
            description="You haven't generated any bills yet. Head to Billing to make a sale."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Tax Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-primary">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(inv.createdAt))}
                  </TableCell>
                  <TableCell>{inv.customerName || "Walk-in Customer"}</TableCell>
                  <TableCell>{inv.paymentMethod}</TableCell>
                  <TableCell>
                    {inv.isGstInvoice ? (
                      <StatusBadge status="info" variant="secondary">GST</StatusBadge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non-GST</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyText amount={inv.grandTotal} className="font-semibold" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
