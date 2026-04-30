import GstToggleButton from "@/app/(dashboard)/components/gst-toggle-button";
import { BillingShell } from "@/features/billing/billing-shell";
import { InvoiceTable } from "@/features/invoices/invoice-table";
import { getInvoices } from "@/lib/api/invoices";
import { getProducts } from "@/lib/api/products";
import RefreshStockButton from "./components/refresh-stock-button";

const page = async () => {
  const [productsResponse, invoicesResponse] = await Promise.all([
    getProducts(),
    getInvoices({ page: 1, limit: 20 }),
  ]);

  const initialProducts = productsResponse?.data;
  const latestInvoices = invoicesResponse.data;

  return (
    <div className="flex flex-col min-h-[calc(100vh-9rem)] animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 animate-in slide-in-from-top duration-500 delay-100">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Billing
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <RefreshStockButton />
          <GstToggleButton />
        </div>
      </div>
      <div className="animate-in fade-in duration-500 delay-200 h-[calc(100vh-12rem)] min-h-136">
        <BillingShell
          initialProducts={initialProducts}
          tenantSettings={{
            defaultGstRate: 18,
            currency: "INR",
          }}
        />
      </div>
      <section className="px-6 py-4 mt-4">
        <div>
          <h2 className="text-2xl font-semibold mb-4 animate-in slide-in-from-left duration-500">
            Latest Invoices
          </h2>
        </div>
        <div className="max-h-112 overflow-auto">
          <InvoiceTable invoices={latestInvoices} />
        </div>
      </section>
    </div>
  );
};

export default page;
