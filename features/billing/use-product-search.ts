"use client";

import clientAxios from "@/lib/axios/client";
import { ProductWithStock } from "@/lib/utils/products";
import { useCallback, useRef, useState } from "react";

export function useProductSearch(tenantId: string) {
  const [results, setResults] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const search = useCallback(
    (query: string) => {
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (!query.trim()) {
        setResults([]);
        return;
      }

      // Set new timeout for debounced search
      debounceTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const { data } = await clientAxios.get(
            `/tenants/${tenantId}/products/search`,
            { params: { q: query } },
          );
          setResults(data.data);
        } catch (error: any) {
          console.error("Product search error:", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [tenantId],
  );

  return { results, loading, search };
}
