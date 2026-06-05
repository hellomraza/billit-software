"use client";

import { useEffect, useState } from "react";
import clientAxios from "@/lib/axios/client";
import { getStoredTenantId } from "@/lib/auth-tokens";
import { SidebarMenuBadge } from "@/components/ui/sidebar";

export function LowStockBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const tenantId = getStoredTenantId();
    if (!tenantId) return;

    const fetchCount = async () => {
      try {
        const { data } = await clientAxios.get(
          `/tenants/${tenantId}/analytics/low-stock`
        );
        if (typeof data.count === "number") {
          setCount(data.count);
        } else if (data.lowStockProducts) {
          setCount(data.lowStockProducts.length);
        }
      } catch (error) {
        // Silently fail - badge is non-critical
        console.error("Failed to fetch low stock count:", error);
      }
    };

    fetchCount();

    // Refresh every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <SidebarMenuBadge className="bg-destructive text-destructive-foreground font-semibold px-1.5 py-0.5 rounded text-xs select-none text-white">
      {count > 99 ? "99+" : count}
    </SidebarMenuBadge>
  );
}
