"use client";

import React, { useState, useMemo } from "react";
import { Product, InvoiceItem } from "@/types";
import { BillingSearch } from "./billing-search";
import { BillingCart } from "./billing-cart";
import { BillingSummaryPanel } from "./billing-summary-panel";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { InsufficientStockModal, DeficitResolutionAction, InsufficientItem } from "@/components/shared/insufficient-stock-modal";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface BillingWorkspaceProps {
  initialProducts: Product[];
  tenantSettings: {
    isGstEnabled: boolean;
    defaultGstRate: number;
    currency: string;
  };
}

export function BillingWorkspace({ initialProducts, tenantSettings }: BillingWorkspaceProps) {
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  // Stock Validation State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [conflictItems, setConflictItems] = useState<InsufficientItem[]>([]);

  const handleSelectProduct = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      
      // Stock checking immediately on add
      const requestedQty = existing ? existing.quantity + 1 : 1;
      if (requestedQty > product.currentStock) {
        toast.warning(`Insufficient inventory for ${product.name}`, {
          description: `Only ${product.currentStock} remaining in stock.`
        });
      }

      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice } : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        gstRate: product.gstRate,
        subtotal: product.basePrice
      }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = initialProducts.find(p => p.id === productId);
    if (product && quantity > product.currentStock) {
      toast.warning(`Insufficient stock for ${product.name}`);
    }

    setCart(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity, subtotal: quantity * item.unitPrice } : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  
  const gstAmount = useMemo(() => {
    if (!tenantSettings.isGstEnabled) return 0;
    return cart.reduce((sum, item) => sum + (item.subtotal * (item.gstRate / 100)), 0);
  }, [cart, tenantSettings.isGstEnabled]);
  
  const grandTotal = subtotal + gstAmount;

  const handleFinalizeInit = () => {
    const conflicts = cart.map(item => {
      const product = initialProducts.find(p => p.id === item.productId)!;
      return { product, requested: item.quantity, available: product.currentStock };
    }).filter(i => i.requested > i.available);

    if (conflicts.length > 0) {
      setConflictItems(conflicts);
      setIsStockModalOpen(true);
    } else {
      finalizeSuccess();
    }
  };

  const handleResolveConflicts = (resolutions: { productId: string; action: DeficitResolutionAction }[]) => {
    let newCart = [...cart];
    
    resolutions.forEach(res => {
      if (res.action === "remove") {
        newCart = newCart.filter(i => i.productId !== res.productId);
      } else if (res.action === "use-available") {
        const item = newCart.find(i => i.productId === res.productId);
        const product = initialProducts.find(p => p.id === res.productId);
        if (item && product) {
          item.quantity = product.currentStock;
          item.subtotal = item.quantity * item.unitPrice;
        }
      }
      // if "sell-anyway", do nothing to the cart quantities
    });

    setCart(newCart);
    setIsStockModalOpen(false);
    
    // Only continue if cart is not empty after resolution
    if (newCart.length > 0) {
      finalizeSuccess(resolutions.filter(r => r.action === "sell-anyway"));
    }
  };

  const finalizeSuccess = (deficitsLogged: any[] = []) => {
    toast.success("Invoice #INV-2049 Finalized", {
      description: `Total ${tenantSettings.currency} ${grandTotal.toFixed(2)} via ${paymentMethod}`
    });
    if (deficitsLogged.length > 0) toast.error(`${deficitsLogged.length} inventory defects logged.`);
    setCart([]);
    setPaymentMethod("CASH");
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 relative">
      <Card className="flex-1 flex flex-col min-h-0 bg-transparent border-0 shadow-none">
        <BillingSearch 
          products={initialProducts} 
          onSelectProduct={handleSelectProduct} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </Card>
      
      <Card className="w-full md:w-[400px] flex flex-col shadow-sm border overflow-hidden shrink-0 min-h-[500px]">
        <BillingCart 
          items={cart} 
          onUpdateQuantity={handleUpdateQuantity} 
          onRemoveItem={handleRemoveItem} 
        />
        <BillingSummaryPanel 
          subtotal={subtotal} 
          gstAmount={gstAmount} 
          grandTotal={grandTotal} 
          isGstEnabled={tenantSettings.isGstEnabled} 
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onFinalize={handleFinalizeInit}
          onClear={() => setIsClearDialogOpen(true)}
          isEnabled={cart.length > 0}
        />
      </Card>

      <ConfirmationDialog 
        isOpen={isClearDialogOpen}
        title="Clear Bill"
        description="Are you sure you want to remove all items from the current bill?"
        confirmText="Clear Bill"
        isDangerous={true}
        onConfirm={() => { setCart([]); setIsClearDialogOpen(false); }}
        onCancel={() => setIsClearDialogOpen(false)}
      />

      <InsufficientStockModal 
        isOpen={isStockModalOpen}
        items={conflictItems}
        onResolve={handleResolveConflicts}
        onCancel={() => setIsStockModalOpen(false)}
      />
    </div>
  );
}
