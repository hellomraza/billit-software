"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InvoiceDetailPanel } from "@/features/invoices/invoice-detail-panel";
import { ROUTES } from "@/lib/routes";
import { RefundButtonState } from "@/lib/utils/refund-eligibility";
import { useInvoiceActions, useOsPreviewMode } from "@/stores/invoice-store";
import { Invoice } from "@/types";
import { Eye, EyeOff, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InvoiceDetailViewClientProps {
  invoice: Invoice;
  refundButtonState: RefundButtonState;
}

export function InvoiceDetailViewClient({
  invoice,
  refundButtonState,
}: InvoiceDetailViewClientProps) {
  const isPreviewMode = useOsPreviewMode();
  const { enablePreviewMode, disablePreviewMode } = useInvoiceActions();
  const router = useRouter();

  const invoiceLabel = invoice.invoiceNumber?.trim() || "Pending Invoice";

  const refundAction =
    refundButtonState.kind === "hidden" ? null : refundButtonState.kind ===
      "enabled" ? (
      <Button
        key="refund"
        variant="outline"
        size="sm"
        onClick={() => router.push(refundButtonState.href)}
        className="gap-2"
      >
        Process Refund
      </Button>
    ) : (
      <TooltipProvider key="refund-tooltip">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="inline-flex">
                <Button variant="outline" size="sm" disabled className="gap-2">
                  Process Refund
                </Button>
              </span>
            }
          />
          <TooltipContent>{refundButtonState.reason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  const pageHeaderActions = [
    ...(refundAction ? [refundAction] : []),
    <Button
      key="preview"
      variant="outline"
      size="sm"
      onClick={() => {
        enablePreviewMode();
        toast.success("Preview Mode Enabled", {
          description: "Showing how invoice will appear when printed",
        });
      }}
      className="gap-2"
    >
      <Eye className="h-4 w-4" />
      Preview
    </Button>,
    <Button
      key="print"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      Print
    </Button>,
  ];

  return (
    <div
      className={`${isPreviewMode ? "print-preview-mode" : "p-4 sm:p-8 space-y-6 max-w-350 mx-auto"}`}
    >
      {!isPreviewMode && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <PageHeader
            title={`Invoice ${invoiceLabel}`}
            breadcrumbs={[
              { label: "Invoices", href: ROUTES.INVOICES },
              { label: invoiceLabel },
            ]}
            actions={pageHeaderActions}
          />
        </div>
      )}

      {/* Print Preview Header */}
      {isPreviewMode && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg flex items-center justify-between print-hidden">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">
              Print Preview Mode - This is how your invoice will look when
              printed
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              disablePreviewMode();
              toast.success("Preview Mode Disabled");
            }}
            className="gap-2"
          >
            <EyeOff className="h-4 w-4" />
            Exit Preview
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
            <strong>Terms & Conditions:</strong> Thank you for your purchase.
            This invoice is valid as a transaction receipt.
          </p>
          <p>
            For queries or complaints, please contact our customer service team.
          </p>
          <p className="mt-2 text-gray-500">
            Document generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
