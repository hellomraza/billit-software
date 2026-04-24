"use client";

import clientAxios from "@/lib/axios/client";
import { StockRecord } from "@/lib/types/api";
import { useCallback, useEffect, useState } from "react";

function toStockRecords(payload: unknown): StockRecord[] {
  if (Array.isArray(payload)) {
    return payload as StockRecord[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data: unknown }).data)
  ) {
    return (payload as { data: StockRecord[] }).data;
  }

  return [];
}

export function useStockRefresh(tenantId: string, outletId: string) {
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!tenantId || !outletId) {
      setStockMap({});
      return;
    }

    setRefreshing(true);
    try {
      const { data } = await clientAxios.get(
        `/tenants/${tenantId}/stock/outlet/${outletId}`,
      );

      const records = toStockRecords(data);
      const nextStockMap: Record<string, number> = {};
      records.forEach((record) => {
        nextStockMap[record.productId] = record.quantity;
      });

      setStockMap(nextStockMap);
    } finally {
      setRefreshing(false);
    }
  }, [tenantId, outletId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stockMap, refresh, refreshing };
}
