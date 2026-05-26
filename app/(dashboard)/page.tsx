import { BillingShell } from "@/features/billing/billing-shell";
import { InvoiceTable } from "@/features/invoices/invoice-table";
import { getInvoices } from "@/lib/api/invoices";
import { getProducts } from "@/lib/api/products";

const page = async () => {
  const [productsResponse, invoicesResponse] = await Promise.all([
    getProducts(),
    getInvoices({ page: 1, limit: 10 }),
  ]);

  const initialProducts = productsResponse?.data;
  const latestInvoices = invoicesResponse.data;

  return (
    <div className="flex flex-col min-h-[calc(100vh-9rem)] animate-in fade-in duration-500 space-y-4">
      <div className="animate-in fade-in duration-500 delay-200 h-[calc(100vh-6rem)] min-h-136">
        <BillingShell
          initialProducts={initialProducts}
          tenantSettings={{ currency: "INR" }}
        />
      </div>
      <section className="px-6 pt-4">
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
