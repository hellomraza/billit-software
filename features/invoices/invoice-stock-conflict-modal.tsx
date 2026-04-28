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
import {
  useInvoiceInsufficientItems,
  useInvoicePhase,
} from "@/stores/invoice-store";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ItemDecision = "use-available" | "override" | "remove";

interface InvoiceStockConflictModalProps {
  isOpen: boolean;
  onConfirm: (decisions: Record<string, ItemDecision>) => void;
  onCancel: () => void;
}

export function InvoiceStockConflictModal({
  isOpen,
  onConfirm,
  onCancel,
}: InvoiceStockConflictModalProps) {
  const items = useInvoiceInsufficientItems();
  const phase = useInvoicePhase();
  const isSubmitting = phase === "submitting";
  const [decisions, setDecisions] = useState<Record<string, ItemDecision>>(
    () => {
      const initial: Record<string, ItemDecision> = {};
      items.forEach((item) => {
        initial[item.productId] =
          item.currentStock > 0 ? "use-available" : "remove";
      });
      return initial;
    },
  );
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize decisions
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => cancelButtonRef.current?.focus(), 50);
  }, [isOpen]);

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
          className="sm:max-w-2xl max-h-[85vh] flex flex-col"
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
              const deficitThresholdExceeded =
                item.requestedQuantity - item.currentStock >
                item.deficitThreshold;
              const currentDecision = decisions[item.productId];
              const deficit = item.requestedQuantity - item.currentStock;

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
                          {item.currentStock}
                        </strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded font-medium">
                        Deficit: {deficit}
                      </div>
                      {currentDecision === "use-available" &&
                        item.currentStock > 0 && (
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
                      disabled={item.currentStock <= 0 || isSubmitting}
                      title={
                        item.currentStock <= 0
                          ? "No stock available"
                          : "Sell only available quantity"
                      }
                    >
                      {currentDecision === "use-available" ? "✓ " : ""}Sell
                      Available ({item.currentStock})
                    </Button>
                    <Button
                      variant={
                        currentDecision === "override" ? "default" : "outline"
                      }
                      size="sm"
                      className="text-xs h-9"
                      onClick={() => updateDecision(item.productId, "override")}
                      disabled={deficitThresholdExceeded || isSubmitting}
                      title={
                        deficitThresholdExceeded
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
              autoFocus
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
