"use client";

import { DeficitGroup } from "@/components/shared/deficit-card";
import { PageHeader } from "@/components/shared/page-header";
import { DeficitList } from "@/features/deficits/deficit-list";
import { getDeficits, resolveDeficitGroup } from "@/lib/mock-data/deficit";
import { getProducts } from "@/lib/mock-data/product";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function DeficitsPage() {
  const [allDeficits, setAllDeficits] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      setIsLoading(true);
      Promise.all([getDeficits(), getProducts()])
        .then(([deficits, prods]) => {
          setAllDeficits(deficits);
          setProducts(prods);
        })
        .catch((error) => {
          toast.error("Failed to load deficits", {
            description: "Please try refreshing the page.",
          });
          console.error("Error loading deficits:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } catch (error) {
      toast.error("Error loading deficits", {
        description: "An unexpected error occurred.",
      });
      console.error("Error:", error);
      setIsLoading(false);
    }
  }, []);

  const recordsByGroup = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    allDeficits.forEach((d) => {
      if (!grouped[d.productId]) grouped[d.productId] = [];
      grouped[d.productId].push(d);
    });
    return grouped;
  }, [allDeficits]);

  const deficitGroups = useMemo<DeficitGroup[]>(() => {
    return (
      Object.entries(recordsByGroup)
        .map(([productId, records]) => {
          const product = products.find((p) => p.id === productId);
          const totalMissing = records.reduce(
            (sum, r) => sum + r.missingQuantity,
            0,
          );
          const status: "PENDING" | "RESOLVED" = records.some(
            (r) => r.status === "PENDING",
          )
            ? "PENDING"
            : "RESOLVED";

          return {
            productId,
            product,
            totalMissing,
            status,
            recordsCount: records.length,
            lastUpdated: records[records.length - 1].createdAt,
          };
        })
        // Filter out RESOLVED deficits from primary view (optional)
        .filter((g) => g.status === "PENDING")
    );
  }, [recordsByGroup, products]);

  const handleResolve = (productId: string, totalMissing: number) => {
    try {
      // Resolve deficit and replenish stock
      resolveDeficitGroup(productId, totalMissing);

      // Update state to reflect changes
      const product = products.find((p) => p.id === productId);
      const productName = product?.name || "Product";

      toast.success("Deficit Resolved", {
        description: `${totalMissing} units of ${productName} restocked to cover shortage.`,
      });

      // Reload deficits from localStorage
      getDeficits().then((deficits) => {
        setAllDeficits(deficits);
      });
    } catch (error) {
      toast.error("Failed to resolve deficit", {
        description: "Please try again.",
      });
      console.error("Error resolving deficit:", error);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="animate-in slide-in-from-top duration-500 delay-100">
        <PageHeader
          title="Inventory Deficits"
          description="Track missing stock quantities resulting from forced sales at zero inventory."
        />
      </div>

      <div className="flex-1 overflow-auto animate-in fade-in duration-500 delay-200">
        <DeficitList
          deficits={deficitGroups}
          recordsByGroup={recordsByGroup}
          onResolve={handleResolve}
        />
      </div>
    </div>
  );
}
