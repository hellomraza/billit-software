"use client";

import { Button } from "@/components/ui/button";
import { BillingWorkspace } from "@/features/billing/billing-workspace";
import { getProducts } from "@/lib/mock-data/product";
import { Receipt, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BillingPage() {
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load initial data and GST preference from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const products = await getProducts();
        setInitialProducts(products);

        // Load GST preference from localStorage
        const savedGstState = localStorage.getItem("billit_gst_enabled");
        if (savedGstState !== null) {
          setIsGstEnabled(savedGstState === "true");
        }
      } catch (error) {
        console.error("Error loading billing data:", error);
        toast.error("Failed to load billing data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleGstToggle = () => {
    const newState = !isGstEnabled;
    setIsGstEnabled(newState);
    localStorage.setItem("billit_gst_enabled", String(newState));

    toast.success(`GST ${newState ? "Enabled" : "Disabled"}`, {
      description: `GST will be ${newState ? "applied to" : "excluded from"} future invoices.`,
    });
  };

  const handleRefreshStock = async () => {
    try {
      setIsRefreshing(true);
      // Simulate API call with 500ms delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fetch fresh product list
      const freshProducts = await getProducts();
      setInitialProducts(freshProducts);

      toast.success("Stock Refreshed", {
        description: "Product inventory has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing stock:", error);
      toast.error("Failed to refresh stock", {
        description: "Please try again.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        </div>
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          <div>Loading billing workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 animate-in slide-in-from-top duration-500 delay-100">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Billing
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStock}
            disabled={isRefreshing}
            className="gap-2 h-9 px-3 text-xs sm:text-sm"
            aria-busy={isRefreshing}
            aria-label="Refresh stock levels"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? "Refreshing..." : "Refresh Stock"}
            </span>
            <span className="sm:hidden">{isRefreshing ? "..." : "Stock"}</span>
          </Button>
          <Button
            variant={isGstEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleGstToggle}
            className="gap-2 h-9 px-3 text-xs sm:text-sm"
            aria-pressed={isGstEnabled}
            aria-label={`GST is ${isGstEnabled ? "enabled" : "disabled"}`}
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">GST</span>
            <span className="font-semibold text-xs">
              {isGstEnabled ? "ON" : "OFF"}
            </span>
          </Button>
        </div>
      </div>
      <div className="animate-in fade-in duration-500 delay-200 flex-1 overflow-hidden">
        <BillingWorkspace
          initialProducts={initialProducts}
          tenantSettings={{
            isGstEnabled,
            defaultGstRate: 18,
            currency: "INR",
          }}
        />
      </div>
    </div>
  );
}
