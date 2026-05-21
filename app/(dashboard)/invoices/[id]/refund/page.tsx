import { RefundSelectionForm } from "@/features/invoices/refund-selection-form";
import { getInvoice } from "@/lib/api/invoices";
import { ROUTES } from "@/lib/routes";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/get-tenant-id";

export default async function RefundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let invoice;

  try {
    invoice = await getInvoice(id);
  } catch {
    // If invoice cannot be fetched, go back to invoices list
    redirect(ROUTES.INVOICES);
  }

  // Guard: cannot refund a REFUND invoice — redirect to invoice detail
  if (invoice.invoiceType === "REFUND") {
    redirect(ROUTES.INVOICE_DETAIL(invoice.id));
  }

  const tenantId = await getTenantId();

  return (
    <RefundSelectionForm
      invoice={invoice}
      existingRefunds={invoice.refunds ?? []}
      tenantId={tenantId}
    />
  );
}
