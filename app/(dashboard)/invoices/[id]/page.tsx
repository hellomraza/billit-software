import { InvoiceDetailViewClient } from "@/features/invoices/invoice-detail-view-client";
import { getInvoice } from "@/lib/api/invoices";
import { notFound } from "next/navigation";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let invoice;

  try {
    invoice = await getInvoice(id);
  } catch {
    notFound();
  }

  return <InvoiceDetailViewClient invoice={invoice} />;
}
