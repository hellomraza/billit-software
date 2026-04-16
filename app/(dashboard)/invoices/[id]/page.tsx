"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { InvoiceDetailPanel } from "@/features/invoices/invoice-detail-panel";
import { getInvoiceById } from "@/lib/mock-data/invoice";
import { ROUTES } from "@/lib/routes";
import { Invoice } from "@/types";
import { Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    getInvoiceById(params.id as string).then((inv) => {
      if (inv) {
        setInvoice(inv);
      } else {
        toast.error("Invoice not found", {
          description: "The invoice you're looking for does not exist.",
        });
        router.push(ROUTES.INVOICES);
      }
    });
  }, [params.id, router]);

  if (!invoice) return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-top-8 duration-500">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <PageHeader
          title={`Invoice ${invoice.invoiceNumber}`}
          breadcrumbs={[
            { label: "Invoices", href: ROUTES.INVOICES },
            { label: invoice.invoiceNumber },
          ]}
          actions={[
            <Button
              key="print"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" /> Print Document
            </Button>,
          ]}
        />
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <InvoiceDetailPanel invoice={invoice} />
      </div>
    </div>
  );
}
