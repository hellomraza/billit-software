import React from "react";
import { getProducts } from "@/lib/mock-data/product";
import { BillingWorkspace } from "@/features/billing/billing-workspace";

export const metadata = {
  title: "Billing | BillIt MVP",
};

export default async function BillingPage() {
  // Fetch initial initial products (SSR)
  const initialProducts = await getProducts();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        {/* We can add quick actions here like 'Refresh Stock' */}
      </div>
      <BillingWorkspace 
        initialProducts={initialProducts} 
        tenantSettings={{
          isGstEnabled: true,
          defaultGstRate: 18,
          currency: "INR"
        }}
      />
    </div>
  );
}
