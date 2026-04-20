import { PageHeader } from "@/components/shared/page-header";
import { InvoiceFiltersBar } from "@/features/invoices/invoice-filters-bar";
import { InvoiceTable } from "@/features/invoices/invoice-table";
import { getInvoices } from "@/lib/api/invoices";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    invoiceNumber?: string;
    paymentMethod?: string;
    gstEnabled?: string;
    productId?: string;
  };
}) {
  try {
    const invoicesData = await getInvoices({
      page: searchParams.page ? Number(searchParams.page) : 1,
      limit: 20,
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      invoiceNumber: searchParams.invoiceNumber,
      paymentMethod: searchParams.paymentMethod as any,
      gstEnabled:
        searchParams.gstEnabled === "true"
          ? true
          : searchParams.gstEnabled === "false"
            ? false
            : undefined,
      productId: searchParams.productId,
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
  } catch (error) {
    console.error("Failed to load invoices:", error);
    return (
      <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-350 mx-auto">
        <PageHeader title="Invoices" />
        <div className="text-center text-muted-foreground">
          <p>Failed to load invoices. Please try again later.</p>
        </div>
      </div>
    );
  }
}
