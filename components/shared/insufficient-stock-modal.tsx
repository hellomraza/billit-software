"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/types";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type DeficitResolutionAction =
  | "use-available"
  | "sell-anyway"
  | "remove";

export interface InsufficientItem {
  product: Product;
  requested: number;
  available: number;
}

interface InsufficientStockModalProps {
  isOpen: boolean;
  items: InsufficientItem[];
  onResolve: (
    resolutions: { productId: string; action: DeficitResolutionAction }[],
  ) => void;
  onCancel: () => void;
}

export function InsufficientStockModal({
  isOpen,
  items,
  onResolve,
  onCancel,
}: InsufficientStockModalProps) {
  const [resolutions, setResolutions] = useState<
    Record<string, DeficitResolutionAction>
  >({});

  useEffect(() => {
    // Default all items to "use-available" if possible, else "remove"
    const initial: Record<string, DeficitResolutionAction> = {};
    items.forEach((item) => {
      initial[item.product.id] =
        item.available > 0 ? "use-available" : "remove";
    });
    setResolutions(initial);
  }, [items]);

  // Calculate summary of actions
  const summary = useMemo(() => {
    const actions = {
      useAvailable: items.filter(
        (item) => resolutions[item.product.id] === "use-available",
      ).length,
      sellAnyway: items.filter(
        (item) => resolutions[item.product.id] === "sell-anyway",
      ).length,
      remove: items.filter((item) => resolutions[item.product.id] === "remove")
        .length,
    };
    return actions;
  }, [resolutions, items]);

  // Calculate if cart will be empty after resolution
  const cartWillBeEmpty = useMemo(() => {
    return summary.remove === items.length;
  }, [summary.remove, items.length]);

  const handleResolve = () => {
    const formatted = Object.entries(resolutions).map(
      ([productId, action]) => ({ productId, action }),
    );
    onResolve(formatted);
  };

  const updateResolution = (
    productId: string,
    action: DeficitResolutionAction,
  ) => {
    setResolutions((prev) => ({ ...prev, [productId]: action }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Stock Conflict Detected
          </DialogTitle>
          <DialogDescription className="mt-2">
            You are trying to sell items that exceed current inventory levels.
            Please choose how to handle each item before finalizing the bill.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 my-3">
          {items.map((item) => {
            const currentResolution = resolutions[item.product.id];
            const isRemoved = currentResolution === "remove";
            const deficit = item.requested - item.available;

            return (
              <div
                key={item.product.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isRemoved
                    ? "bg-muted/40 opacity-60"
                    : "bg-muted/20 hover:bg-muted/30"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requested:{" "}
                      <strong className="text-foreground">
                        {item.requested}
                      </strong>{" "}
                      • Available:{" "}
                      <strong className="text-foreground">
                        {item.available}
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded font-medium">
                      Deficit: {deficit}
                    </div>
                    {currentResolution === "use-available" &&
                      item.available > 0 && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={
                      currentResolution === "use-available"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="text-xs h-9"
                    onClick={() =>
                      updateResolution(item.product.id, "use-available")
                    }
                    disabled={item.available <= 0}
                    title={item.available <= 0 ? "No stock available" : ""}
                  >
                    {currentResolution === "use-available" ? "✓ " : ""}Sell
                    Available ({item.available})
                  </Button>
                  <Button
                    variant={
                      currentResolution === "sell-anyway"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="text-xs h-9"
                    onClick={() =>
                      updateResolution(item.product.id, "sell-anyway")
                    }
                    title="Complete sale and log inventory deficit"
                  >
                    {currentResolution === "sell-anyway" ? "✓ " : ""}Sell Anyway
                  </Button>
                  <Button
                    variant={
                      currentResolution === "remove" ? "destructive" : "outline"
                    }
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => updateResolution(item.product.id, "remove")}
                    title="Remove from invoice"
                  >
                    {currentResolution === "remove" ? (
                      <Trash2 className="h-3 w-3 mr-1" />
                    ) : (
                      ""
                    )}
                    {currentResolution === "remove" ? "Remove" : "Remove"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning when cart will be empty */}
        {cartWillBeEmpty && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Warning: All items will be removed. Your bill will be cleared.
            </p>
          </div>
        )}

        {/* Summary of actions */}
        <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Resolution Summary:
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Sell Available:</span>
              <span className="block font-semibold text-foreground">
                {summary.useAvailable}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Log Deficit:</span>
              <span className="block font-semibold text-destructive">
                {summary.sellAnyway}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Remove:</span>
              <span className="block font-semibold text-muted-foreground">
                {summary.remove}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="ghost" onClick={onCancel}>
            Go Back
          </Button>
          <Button
            onClick={handleResolve}
            disabled={cartWillBeEmpty}
            title={cartWillBeEmpty ? "Cannot proceed - all items removed" : ""}
          >
            Apply & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
