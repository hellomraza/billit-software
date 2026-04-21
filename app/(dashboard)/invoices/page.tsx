import { PageHeader } from "@/components/shared/page-header";
import { InvoiceFiltersBar } from "@/features/invoices/invoice-filters-bar";
import { InvoiceTable } from "@/features/invoices/invoice-table";
import { getInvoices } from "@/lib/api/invoices";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    invoiceNumber?: string;
    paymentMethod?: string;
    gstEnabled?: string;
    productId?: string;
  }>;
}) {
  const searchParamValues = await searchParams;
  const invoicesData = await getInvoices({
    page: searchParamValues.page ? Number(searchParamValues.page) : 1,
    limit: 20,
    dateFrom: searchParamValues.dateFrom,
    dateTo: searchParamValues.dateTo,
    invoiceNumber: searchParamValues.invoiceNumber,
    paymentMethod: searchParamValues.paymentMethod as
      | "CASH"
      | "CARD"
      | "UPI"
      | undefined,
    gstEnabled:
      searchParamValues.gstEnabled === "true"
        ? true
        : searchParamValues.gstEnabled === "false"
          ? false
          : undefined,
    productId: searchParamValues.productId,
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-350 mx-auto">
      <PageHeader title="Invoices" />

      <InvoiceFiltersBar />

      <div className="flex-1 overflow-auto">
        <InvoiceTable
          invoices={invoicesData.data}
          pagination={{
            page: invoicesData.page,
            limit: invoicesData.limit,
            total: invoicesData.total,
          }}
        />
      </div>
    </div>
  );
}
