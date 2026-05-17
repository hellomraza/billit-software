"use client";

import { MoneyText } from "@/components/shared/money-text";
import { SearchBar } from "@/components/shared/search-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProductSearch } from "@/features/billing/use-product-search";
import { useStockRefresh } from "@/features/billing/use-stock-refresh";
import { getStoredOutletId, getStoredTenant } from "@/lib/auth-tokens";
import { formatStock } from "@/lib/formatters/quantity";
import { ProductWithStock } from "@/lib/utils/products";
import {
  useInvoiceActions,
  useInvoiceSearchQuery,
} from "@/stores/invoice-store";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface BillingSearchProps {
  onSelectProduct: (product: ProductWithStock) => void;
  initialProducts: ProductWithStock[];
  isReadOnly?: boolean;
}

function HighlightedText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  const normalizedHighlight = highlight.trim();
  if (!normalizedHighlight) {
    return <span className="wrap-break-word">{text}</span>;
  }

  const escapedHighlight = normalizedHighlight.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === normalizedHighlight.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200/70 dark:bg-yellow-700/70 font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i} className="wrap-break-word">
            {part}
          </span>
        ),
      )}
    </>
  );
}

export function BillingSearch({
  onSelectProduct,
  initialProducts,
  isReadOnly = false,
}: BillingSearchProps) {
  const { setSearchQuery } = useInvoiceActions();
  const searchQuery = useInvoiceSearchQuery();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [tenantId] = useState(() => {
    const tenant = getStoredTenant();
    return tenant?._id || null;
  });

  const [outletId] = useState(() => {
    return getStoredOutletId();
  });

  // Initialize API search hook with tenantId
  const {
    results: apiResults,
    loading: apiLoading,
    search,
  } = useProductSearch(tenantId || "", outletId || "");
  const { stockMap, refresh, refreshing } = useStockRefresh(
    tenantId || "",
    outletId || "",
  );

  // Trigger API search when search query changes
  useEffect(() => {
    if (tenantId && searchQuery) {
      search(searchQuery);
    }
  }, [searchQuery, tenantId, search]);

  // Keyboard shortcut: Alt+S to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayedProducts = searchQuery ? apiResults : initialProducts;

  return (
    <div className="flex flex-col h-full ">
      <div className="px-4 flex items-center gap-2">
        <div
          title={isReadOnly ? "Editing paused while offline" : undefined}
          className={isReadOnly ? "flex-1 opacity-80" : "flex-1"}
        >
          <SearchBar
            ref={searchInputRef}
            onSearch={setSearchQuery}
            placeholder="Search products by name or code (Alt+S)"
            className="max-w-full h-12 text-md flex-1"
            loading={apiLoading && searchQuery ? true : false}
            disabled={isReadOnly}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-12 px-3"
          disabled={!tenantId || !outletId || refreshing || isReadOnly}
          onClick={() => void refresh()}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Refresh stock</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 content-start">
        {displayedProducts?.map((product) => (
          <Card
            key={product._id}
            className={`transition-colors flex flex-col h-25 py-2 px-2 justify-start ${isReadOnly ? "cursor-default opacity-80" : "cursor-pointer hover:border-primary/50"}`}
            onClick={() => {
              if (!isReadOnly) onSelectProduct(product);
            }}
            aria-disabled={isReadOnly}
          >
            <CardContent className="p-3 flex flex-col justify-between flex-1 text-xs">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-lg leading-tight line-clamp-2 wrap-break-word overflow-hidden"
                    title={product.name}
                  >
                    <HighlightedText
                      text={product.name}
                      highlight={searchQuery}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex items-start justify-end">
                  {product.stock && product.stock > 0 ? (
                    <span className="text-muted-foreground font-medium whitespace-nowrap">
                      {formatStock(product.stock, product.deficitThreshold)}
                    </span>
                  ) : (
                    <StatusBadge
                      status="danger"
                      variant="secondary"
                      className="text-[10px] px-1 h-4 shrink-0 whitespace-nowrap"
                    >
                      Out of Stock
                    </StatusBadge>
                  )}
                </div>
              </div>
              <MoneyText
                amount={product.basePrice}
                className="text-sm font-semibold shrink-0"
              />
            </CardContent>
          </Card>
        ))}
        {searchQuery && !apiLoading && apiResults.length === 0 && tenantId && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No products found matching &quot;{searchQuery}&quot;
          </div>
        )}
        {apiLoading && searchQuery && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <div className="inline-block h-6 w-6 rounded-full border-t-2 border-primary animate-spin mb-2" />
            <p>Searching products...</p>
          </div>
        )}
      </div>
    </div>
  );
}
