"use client";

import React, { useMemo } from "react";
import { Product } from "@/types";
import { SearchBar } from "@/components/shared/search-bar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatStock } from "@/lib/formatters/quantity";

interface BillingSearchProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function BillingSearch({ products, onSelectProduct, searchQuery, onSearchChange }: BillingSearchProps) {
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, products]);

  return (
    <div className="flex flex-col space-y-4 h-full">
      <SearchBar 
        onSearch={onSearchChange} 
        placeholder="Search products by name or code (Alt+S)" 
        className="max-w-full h-12 text-md"
      />
      
      <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 content-start">
        {filteredProducts.map(product => (
          <Card 
            key={product.id} 
            className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-[100px]"
            onClick={() => onSelectProduct(product)}
          >
            <CardHeader className="p-3 pb-1">
              <div className="flex justify-between items-start gap-2">
                <div className="font-medium line-clamp-2 text-sm leading-tight">{product.name}</div>
                <MoneyText amount={product.basePrice} className="text-sm shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 mt-auto flex justify-between items-center text-xs">
              {product.currentStock > 0 ? (
                <span className="text-muted-foreground font-medium">
                  {formatStock(product.currentStock, product.deficitThreshold)}
                </span>
              ) : (
                <StatusBadge status="danger" variant="secondary" className="text-[10px] px-1 h-4">Out of Stock</StatusBadge>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No products found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
