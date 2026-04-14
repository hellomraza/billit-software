"use client";

import React, { useState, useMemo } from "react";
import { Product, InvoiceItem } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, ShoppingCart, Plus, Trash2 } from "lucide-react";
import { QuantityControl } from "@/components/shared/quantity-control";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";

interface BillingWorkspaceProps {
  initialProducts: Product[];
}

export function BillingWorkspace({ initialProducts }: BillingWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">("UPI");

  // Client-side fast filtering
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return initialProducts;
    return initialProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, initialProducts]);

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      toast.warning(`Cannot add ${product.name}. Out of stock.`);
      // In a full implementation, we'd open the Insufficient Stock Modal here.
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.basePrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.basePrice,
        quantity: 1,
        gstRate: product.gstRate,
        subtotal: product.basePrice,
      }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    
    // Check against mock stock logically (simplification for MVP)
    const product = initialProducts.find(p => p.id === productId);
    if (product && newQuantity > product.currentStock) {
      toast.error(`Only ${product.currentStock} units available.`);
      return;
    }

    setCart(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
        : item
    ));
  };

  const clearBill = () => {
    setCart([]);
    toast.success("Bill cleared.");
  };

  const finalizeBill = () => {
    if (cart.length === 0) return;
    toast.success(`Invoice generated for ${cart.length} items (${paymentMethod}).`);
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalGst = isGstEnabled 
    ? cart.reduce((sum, item) => sum + (item.subtotal * (item.gstRate / 100)), 0)
    : 0;
  const grandTotal = subtotal + totalGst;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      
      {/* Left Panel: Products */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products by name or code (Alt+S)" 
            className="pl-9 h-12 text-md bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 h-[500px] lg:h-auto content-start">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col"
              onClick={() => addToCart(product)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-medium line-clamp-2 text-sm">{product.name}</div>
                  <MoneyText amount={product.basePrice} className="text-sm shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 mt-auto flex justify-between items-center text-xs">
                {product.currentStock > 0 ? (
                  <span className="text-muted-foreground font-medium">{product.currentStock} in stock</span>
                ) : (
                  <StatusBadge status="danger" variant="secondary" className="text-[10px] px-1 h-4">Out of Stock</StatusBadge>
                )}
                {product.currentStock > 0 && product.currentStock <= product.deficitThreshold && (
                  <span className="text-warning font-medium">Low</span>
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

      {/* Right Panel: Cart */}
      <Card className="flex flex-col h-full max-h-[600px] lg:max-h-full">
        <CardHeader className="border-b px-4 py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Current Bill
          </CardTitle>
          <BadgeCartCount count={cart.length} />
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
              <ShoppingCart className="h-12 w-12 opacity-20 mb-4" />
              <p>Scan or select products to add them to the bill.</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.productId} className="p-4 flex gap-3">
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="font-medium text-sm leading-tight mb-2">{item.productName}</div>
                    <MoneyText amount={item.unitPrice} className="text-muted-foreground text-xs" />
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <QuantityControl 
                      quantity={item.quantity} 
                      onChange={(q) => updateQuantity(item.productId, q)} 
                      min={0}
                    />
                    <MoneyText amount={item.subtotal} className="font-semibold text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="border-t bg-muted/30">
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <MoneyText amount={subtotal} />
            </div>
            {isGstEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST</span>
                <MoneyText amount={totalGst} />
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-base">Grand Total</span>
              <MoneyText amount={grandTotal} className="text-xl font-bold text-primary" />
            </div>
          </div>
          <div className="p-4 pt-0 gap-2 flex flex-col">
            <div className="flex gap-2 mb-2">
              {(["CASH", "CARD", "UPI"] as const).map(method => (
                <Button 
                  key={method}
                  variant={paymentMethod === method ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
            <Button 
              size="lg" 
              className="w-full font-bold" 
              disabled={cart.length === 0}
              onClick={finalizeBill}
            >
              Finalize Invoice
            </Button>
            {cart.length > 0 && (
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={clearBill}>
                Clear Bill
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function BadgeCartCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
      {count}
    </span>
  );
}
