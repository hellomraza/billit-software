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
import { InsufficientStockItem } from "@/features/billing/use-invoice-creation";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ItemDecision = "use-available" | "override" | "remove";

interface InvoiceStockConflictModalProps {
  isOpen: boolean;
  items: InsufficientStockItem[];
  onConfirm: (decisions: Record<string, ItemDecision>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function InvoiceStockConflictModal({
  isOpen,
  items,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: InvoiceStockConflictModalProps) {
  const [decisions, setDecisions] = useState<Record<string, ItemDecision>>({});
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize decisions
  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, ItemDecision> = {};
    items.forEach((item) => {
      initial[item.productId] =
        item.availableQuantity > 0 ? "use-available" : "remove";
    });
    setDecisions(initial);

    // Focus cancel button when modal opens
    setTimeout(() => cancelButtonRef.current?.focus(), 50);
  }, [isOpen, items]);

  // Calculate summary
  const summary = useMemo(() => {
    return {
      useAvailable: items.filter(
        (item) => decisions[item.productId] === "use-available",
      ).length,
      override: items.filter((item) => decisions[item.productId] === "override")
        .length,
      remove: items.filter((item) => decisions[item.productId] === "remove")
        .length,
    };
  }, [decisions, items]);

  // Check if cart will be empty
  const cartWillBeEmpty = useMemo(() => {
    return summary.remove === items.length;
  }, [summary, items.length]);

  const updateDecision = (productId: string, decision: ItemDecision) => {
    setDecisions((prev) => ({ ...prev, [productId]: decision }));
  };

  const handleConfirm = () => {
    const sellCount = items.filter(
      (item) => decisions[item.productId] !== "remove",
    ).length;
    announceAction(
      `Stock conflict resolved. ${sellCount} item(s) will be processed.`,
    );
    onConfirm(decisions);
  };

  const announceAction = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        ref={announcementRef}
        className="sr-only"
      />
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] flex flex-col"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="stock-conflict-title"
        >
          <DialogHeader>
            <DialogTitle
              className="text-xl text-destructive flex items-center gap-2"
              id="stock-conflict-title"
            >
              <AlertCircle className="h-5 w-5" />
              Stock Conflict Detected
            </DialogTitle>
            <DialogDescription className="mt-2">
              You are trying to sell items that exceed current inventory levels.
              Choose how to handle each item before finalizing the invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 my-3">
            {items.map((item) => {
              const currentDecision = decisions[item.productId];
              const deficit = item.requestedQuantity - item.availableQuantity;

              return (
                <div
                  key={item.productId}
                  className={`border rounded-lg p-4 transition-colors ${
                    currentDecision === "remove"
                      ? "bg-muted/40 opacity-60"
                      : "bg-muted/20 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested:{" "}
                        <strong className="text-foreground">
                          {item.requestedQuantity}
                        </strong>{" "}
                        • Available:{" "}
                        <strong className="text-foreground">
                          {item.availableQuantity}
                        </strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded font-medium">
                        Deficit: {deficit}
                      </div>
                      {currentDecision === "use-available" &&
                        item.availableQuantity > 0 && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={
                        currentDecision === "use-available"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="text-xs h-9"
                      onClick={() =>
                        updateDecision(item.productId, "use-available")
                      }
                      disabled={item.availableQuantity <= 0 || isSubmitting}
                      title={
                        item.availableQuantity <= 0
                          ? "No stock available"
                          : "Sell only available quantity"
                      }
                    >
                      {currentDecision === "use-available" ? "✓ " : ""}Sell
                      Available ({item.availableQuantity})
                    </Button>
                    <Button
                      variant={
                        currentDecision === "override" ? "default" : "outline"
                      }
                      size="sm"
                      className="text-xs h-9"
                      onClick={() => updateDecision(item.productId, "override")}
                      disabled={item.deficitThresholdExceeded || isSubmitting}
                      title={
                        item.deficitThresholdExceeded
                          ? "Override blocked by deficit threshold"
                          : "Sell full amount"
                      }
                    >
                      {currentDecision === "override" ? "✓ " : ""}Sell Anyway
                    </Button>
                    <Button
                      variant={
                        currentDecision === "remove" ? "destructive" : "outline"
                      }
                      size="sm"
                      className="text-xs h-9"
                      onClick={() => updateDecision(item.productId, "remove")}
                      disabled={isSubmitting}
                      title="Remove from invoice"
                    >
                      {currentDecision === "remove" ? (
                        <Trash2 className="h-3 w-3 mr-1" />
                      ) : (
                        ""
                      )}
                      {currentDecision === "remove" ? "Remove" : "Remove"}
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
                All items will be removed. The invoice cannot be finalized.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              ref={cancelButtonRef}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={cartWillBeEmpty || isSubmitting}
            >
              {isSubmitting ? "Confirming..." : "Confirm & Finalize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
