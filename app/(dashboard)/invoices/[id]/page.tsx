"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { InvoiceDetailPanel } from "@/features/invoices/invoice-detail-panel";
import { getInvoiceById } from "@/lib/mock-data/invoice";
import { ROUTES } from "@/lib/routes";
import { Invoice } from "@/types";
import { Eye, EyeOff, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
    <div className={`${isPreviewMode ? "print-preview-mode" : "p-4 sm:p-8 space-y-6 max-w-5xl mx-auto"}`}>
      {!isPreviewMode && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <PageHeader
            title={`Invoice ${invoice.invoiceNumber}`}
            breadcrumbs={[
              { label: "Invoices", href: ROUTES.INVOICES },
              { label: invoice.invoiceNumber },
            ]}
            actions={[
              <Button
                key="preview"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPreviewMode(true);
                  toast.success("Preview Mode Enabled", {
                    description: "Showing how invoice will appear when printed",
                  });
                }}
              >
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>,
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
      )}

      {/* Print Preview Header */}
      {isPreviewMode && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg mb-4 flex items-center justify-between print-hidden">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">
              Print Preview Mode - This is how your invoice will look when printed
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsPreviewMode(false);
              toast.success("Preview Mode Disabled");
            }}
          >
            <EyeOff className="mr-2 h-4 w-4" /> Exit Preview
          </Button>
        </div>
      )}

      {/* Invoice Content */}
      <div
        className={`${
          isPreviewMode
            ? "print-preview-container bg-white shadow-lg max-w-4xl mx-auto p-8 space-y-6"
            : "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
        }`}
      >
        <InvoiceDetailPanel invoice={invoice} />
      </div>

      {/* Print Footer */}
      {isPreviewMode && (
        <div className="print-footer bg-gray-100 border-t mt-8 p-6 text-center text-xs text-gray-600">
          <p className="mb-2">
            <strong>Terms & Conditions:</strong> Thank you for your purchase. This invoice is valid as a
            transaction receipt.
          </p>
          <p>For queries or complaints, please contact our customer service team.</p>
          <p className="mt-2 text-gray-500">Document generated on {new Date().toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
