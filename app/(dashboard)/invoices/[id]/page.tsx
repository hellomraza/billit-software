"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceDetailPanel } from "@/features/invoices/invoice-detail-panel";
import { getInvoiceById } from "@/lib/mock-data/invoice";
import { Invoice } from "@/types";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    getInvoiceById(params.id as string).then((inv) => {
      if (inv) {
        setInvoice(inv);
      } else {
        router.push(ROUTES.INVOICES);
      }
    });
  }, [params.id, router]);

  if (!invoice) return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title={`Invoice ${invoice.invoiceNumber}`} 
        breadcrumbs={[
          { label: "Invoices", href: ROUTES.INVOICES },
          { label: invoice.invoiceNumber }
        ]}
        actions={[
          <Button key="print" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Document
          </Button>
        ]}
      />
      <InvoiceDetailPanel invoice={invoice} />
    </div>
  );
}
