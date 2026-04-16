"use client";

import { MoneyText } from "@/components/shared/money-text";
import { SearchBar } from "@/components/shared/search-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatStock } from "@/lib/formatters/quantity";
import { Product } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

interface BillingSearchProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
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
  products,
  onSelectProduct,
  searchQuery,
  onSearchChange,
}: BillingSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Simulate search loading for 150ms after search query changes
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 150);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    // Clear results on empty query
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.productCode?.toLowerCase().includes(query) ?? false),
    );
  }, [searchQuery, products]);

  return (
    <div className="flex flex-col space-y-4 h-full">
      <SearchBar
        ref={searchInputRef}
        onSearch={onSearchChange}
        placeholder="Search products by name or code (Alt+S)"
        className="max-w-full h-12 text-md"
        loading={isSearching}
      />

      <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 content-start">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-[100px]"
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
                  {product.productCode && (
                    <div className="text-xs text-muted-foreground">
                      Code:{" "}
                      <HighlightedText
                        text={product.productCode}
                        highlight={searchQuery}
                      />
                    </div>
                  )}
                </div>
                <MoneyText
                  amount={product.basePrice}
                  className="text-sm shrink-0"
                />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 mt-auto flex justify-between items-center text-xs">
              {product.currentStock > 0 ? (
                <span className="text-muted-foreground font-medium">
                  {formatStock(product.currentStock, product.deficitThreshold)}
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
        {searchQuery && !isSearching && filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No products found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
