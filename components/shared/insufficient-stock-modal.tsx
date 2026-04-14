"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";

export type DeficitResolutionAction = "use-available" | "sell-anyway" | "remove";

export interface InsufficientItem {
  product: Product;
  requested: number;
  available: number;
}

interface InsufficientStockModalProps {
  isOpen: boolean;
  items: InsufficientItem[];
  onResolve: (resolutions: { productId: string; action: DeficitResolutionAction }[]) => void;
  onCancel: () => void;
}

export function InsufficientStockModal({ isOpen, items, onResolve, onCancel }: InsufficientStockModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, DeficitResolutionAction>>({});

  useEffect(() => {
    // Default all items to "use-available" if possible, else "remove"
    const initial: Record<string, DeficitResolutionAction> = {};
    items.forEach(item => {
      initial[item.product.id] = item.available > 0 ? "use-available" : "remove";
    });
    setResolutions(initial);
  }, [items]);

  const handleResolve = () => {
    const formatted = Object.entries(resolutions).map(([productId, action]) => ({ productId, action }));
    onResolve(formatted);
  };

  const updateResolution = (productId: string, action: DeficitResolutionAction) => {
    setResolutions(prev => ({ ...prev, [productId]: action }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl text-destructive flex items-center gap-2">
            Stock Conflict Detected
          </DialogTitle>
          <DialogDescription>
            You are trying to sell items that exceed current inventory levels. Please choose how to handle each item before finalizing the bill.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 my-2">
          {items.map((item) => (
            <div key={item.product.id} className="border rounded-lg p-4 bg-muted/20">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Requested: <strong className="text-foreground">{item.requested}</strong> • 
                    Available: <strong className="text-foreground">{item.available}</strong>
                  </p>
                </div>
                <div className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded font-medium">
                  Deficit: {item.requested - item.available}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={resolutions[item.product.id] === "use-available" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => updateResolution(item.product.id, "use-available")}
                  disabled={item.available <= 0}
                >
                  Sell Available ({item.available})
                </Button>
                <Button 
                  variant={resolutions[item.product.id] === "sell-anyway" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => updateResolution(item.product.id, "sell-anyway")}
                >
                  Sell Anyway (Log Deficit)
                </Button>
                <Button 
                  variant={resolutions[item.product.id] === "remove" ? "destructive" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => updateResolution(item.product.id, "remove")}
                >
                  Remove Item
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={onCancel}>
            Go Back
          </Button>
          <Button onClick={handleResolve}>
            Apply Changes & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
