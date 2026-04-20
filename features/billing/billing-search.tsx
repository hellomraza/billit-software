"use client";

import { MoneyText } from "@/components/shared/money-text";
import { SearchBar } from "@/components/shared/search-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useProductSearch } from "@/features/billing/use-product-search";
import { getStoredTenant } from "@/lib/auth-tokens";
import { formatStock } from "@/lib/formatters/quantity";
import { ProductWithStock } from "@/lib/utils/products";
import { useEffect, useRef, useState } from "react";

interface BillingSearchProps {
  onSelectProduct: (product: ProductWithStock) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function HighlightedText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  if (!highlight) return <>{text}</>;

  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200/70 dark:bg-yellow-700/70 font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function BillingSearch({
  onSelectProduct,
  searchQuery,
  onSearchChange,
}: BillingSearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [tenantId] = useState(() => {
    const tenant = getStoredTenant();
    return tenant?._id || null;
  });

  // Initialize API search hook with tenantId
  const {
    results: apiResults,
    loading: apiLoading,
    search,
  } = useProductSearch(tenantId || "");

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

  // Use API results for search
  const displayedProducts = apiResults;

  console.log(displayedProducts);
  return (
    <div className="flex flex-col space-y-4 h-full">
      <SearchBar
        ref={searchInputRef}
        onSearch={onSearchChange}
        placeholder="Search products by name or code (Alt+S)"
        className="max-w-full h-12 text-md"
        loading={apiLoading && searchQuery ? true : false}
      />

      <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 content-start">
        {displayedProducts?.map((product) => (
          <Card
            key={product._id}
            className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-25"
            onClick={() => onSelectProduct(product)}
          >
            <CardHeader className="p-3 pb-1">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="font-medium line-clamp-2 text-sm leading-tight">
                    <HighlightedText
                      text={product.name}
                      highlight={searchQuery}
                    />
                  </div>
                </div>
                <MoneyText
                  amount={product.basePrice}
                  className="text-sm shrink-0"
                />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 mt-auto flex justify-between items-center text-xs">
              {product.stock && product.stock > 0 ? (
                <span className="text-muted-foreground font-medium">
                  {formatStock(product.stock, product.deficitThreshold)}
                </span>
              ) : (
                <StatusBadge
                  status="danger"
                  variant="secondary"
                  className="text-[10px] px-1 h-4"
                >
                  Out of Stock
                </StatusBadge>
              )}
            </CardContent>
          </Card>
        ))}
        {searchQuery &&
          !apiLoading &&
          displayedProducts.length === 0 &&
          tenantId && (
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
