import { getInvoice } from "@/lib/api/invoices";
import { InvoiceDetailViewClient } from "@/features/invoices/invoice-detail-view-client";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await getInvoice(params.id);

  return <InvoiceDetailViewClient invoice={invoice} />;
}
