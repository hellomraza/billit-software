import GstToggleButton from "@/app/(dashboard)/components/gst-toggle-button";
import { BillingWorkspace } from "@/features/billing/billing-workspace";
import { getProducts } from "@/lib/api/products";
import RefreshStockButton from "./components/refresh-stock-button";

const page = async () => {
  const response = await getProducts();
  const initialProducts = response?.data;
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 animate-in slide-in-from-top duration-500 delay-100">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Billing
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <RefreshStockButton />
          <GstToggleButton />
        </div>
      </div>
      <div className="animate-in fade-in duration-500 delay-200 flex-1 overflow-hidden">
        <BillingWorkspace
          initialProducts={initialProducts}
          tenantSettings={{
            defaultGstRate: 18,
            currency: "INR",
          }}
        />
      </div>
    </div>
  );
};

export default page;
