"use client";

import { DeficitGroup } from "@/components/shared/deficit-card";
import { PageHeader } from "@/components/shared/page-header";
import { DeficitList } from "@/features/deficits/deficit-list";
import { getDeficits } from "@/lib/mock-data/deficit";
import { getProducts } from "@/lib/mock-data/product";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function DeficitsPage() {
  const [allDeficits, setAllDeficits] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getDeficits(), getProducts()]).then(([deficits, prods]) => {
      setAllDeficits(deficits);
      setProducts(prods);
    });
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
    return Object.entries(recordsByGroup).map(([productId, records]) => {
      const product = products.find((p) => p.id === productId);
      const totalMissing = records.reduce(
        (sum, r) => sum + r.missingQuantity,
        0,
      );
      const status = records.some((r) => r.status === "PENDING")
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
    });
  }, [recordsByGroup, products]);

  const handleResolve = (productId: string) => {
    toast.success("Deficit Acknowledged", {
      description: "Inventory restock required to satisfy debt",
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col max-w-[1400px] mx-auto">
      <PageHeader
        title="Inventory Deficits"
        description="Track missing stock quantities resulting from forced sales at zero inventory."
      />

      <div className="flex-1 overflow-auto">
        <DeficitList
          deficits={deficitGroups}
          recordsByGroup={recordsByGroup}
          onResolve={handleResolve}
        />
      </div>
    </div>
  );
}
