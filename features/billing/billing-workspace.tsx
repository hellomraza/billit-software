"use client";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { MoneyText } from "@/components/shared/money-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceStockConflictModal } from "@/features/invoices/invoice-stock-conflict-modal";
import { ProductWithStock } from "@/lib/utils/products";
import { useIsGstEnabled } from "@/stores/get-store";
import {
  useInvoiceActions,
  useInvoiceCarts,
  useInvoicePaymentMethod,
  useInvoicePhase,
  useInvoiceStore,
  useInvoiceSummary,
} from "@/stores/invoice-store";
import { useState } from "react";
import { toast } from "sonner";
import { BillingCart } from "./billing-cart";
import { BillingCustomerDetails } from "./billing-customer-details";
import { BillingSearch } from "./billing-search";
import { BillingSummaryPanel } from "./billing-summary-panel";

interface BillingWorkspaceProps {
  initialProducts: ProductWithStock[];
  tenantSettings: {
    defaultGstRate: number;
    currency: string;
  };
}

export function BillingWorkspace({
  initialProducts,
  tenantSettings,
}: BillingWorkspaceProps) {
  const gstEnabled = useIsGstEnabled();
  const products = initialProducts;
  const cart = useInvoiceCarts();
  const actions = useInvoiceActions();
  const paymentMethod = useInvoicePaymentMethod();
  const phase = useInvoicePhase();
  const { subtotal, gstAmount, grandTotal } = useInvoiceSummary();
  const { isClearDialogOpen, isStockModalOpen } = useInvoiceStore();
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  const isSubmitting = phase === "submitting";

  const handleSelectProduct = (product: ProductWithStock) => {
    const existing = cart.find((item) => item.productId === product._id);
    const requestedQty = existing ? existing.quantity + 1 : 1;
    const availableStock = product.stock || 0;

    if (requestedQty > availableStock) {
      toast.warning(`Insufficient inventory for ${product.name}`, {
        description: `Only ${availableStock} remaining in stock.`,
      });
    }

    actions.addCartItem(
      {
        productId: product._id,
        productName: product.name,
        unitPrice: product.basePrice,
        gstRate: product.gstRate,
      },
      1,
    );
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p._id === productId);
    const availableStock = product?.stock ?? 0;
    if (product && quantity > availableStock) {
      toast.warning(`Insufficient stock for ${product.name}`);
    }

    actions.updateCartItemQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: string) => {
    actions.removeCartItem(productId);
  };

  const openFinalizeDialog = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setIsFinalizeDialogOpen(true);
  };

  const handleFinalizeConfirm = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const result = await actions.submitInvoice(gstEnabled);

    if (result.success && result.phase === "success") {
      actions.resetInvoiceDraft();
      setIsFinalizeDialogOpen(false);

      toast.success(`Invoice #${result.invoice?.invoiceNumber} Created`, {
        description: `Total ${tenantSettings.currency} ${result.invoice?.grandTotal.toFixed(2)} via ${paymentMethod}`,
      });
    } else if (result.phase === "stock_conflict") {
      setIsFinalizeDialogOpen(false);
      actions.openStockModal();
    } else {
      toast.error("Failed to create invoice", {
        description: result.message || "Failed to create invoice",
      });
    }
  };

  const handleStockConflictDecision = async (
    decisions: Record<string, "use-available" | "override" | "remove">,
  ) => {
    let updatedCart = [...cart];
    const removedItems: string[] = [];

    Object.entries(decisions).forEach(([productId, decision]) => {
      if (decision === "remove") {
        const item = updatedCart.find((i) => i.productId === productId);
        if (item) removedItems.push(item.productName);
        updatedCart = updatedCart.filter((i) => i.productId !== productId);
      } else if (decision === "use-available") {
        const item = updatedCart.find((i) => i.productId === productId);
        const product = products.find((p) => p._id === productId);
        if (item && product) {
          item.quantity = product.stock ?? 0;
          item.subtotal = item.quantity * item.unitPrice;
        }
      }
    });

    if (updatedCart.length === 0) {
      toast.error("All items were removed", {
        description: "Your bill has been cleared. No invoice was created.",
      });
      actions.resetInvoiceDraft();
      actions.closeStockModal();
      return;
    }

    actions.setCart(updatedCart);

    const overrides: Record<string, { quantity: number; override: boolean }> =
      {};
    Object.entries(decisions).forEach(([productId, decision]) => {
      if (decision === "override") {
        const item = updatedCart.find((i) => i.productId === productId);
        if (item) {
          overrides[productId] = {
            quantity: item.quantity,
            override: true,
          };
        }
      }
    });

    const result = await actions.submitInvoice(gstEnabled, overrides);

    if (result.success && result.phase === "success") {
      actions.closeStockModal();
      actions.resetInvoiceDraft();

      toast.success(`Invoice #${result.invoice?.invoiceNumber} Created`, {
        description: `Total ${tenantSettings.currency} ${result.invoice?.grandTotal.toFixed(2)} via ${paymentMethod}`,
      });

      if (removedItems.length > 0) {
        toast.info(
          `Removed ${removedItems.length} item${removedItems.length > 1 ? "s" : ""} from bill`,
          { description: removedItems.join(", ") },
        );
      }
    } else if (result.phase === "stock_conflict") {
      toast.warning("Stock conflict persists. Please review your selections.");
    } else {
      toast.error("Failed to create invoice", {
        description: result.message || "Failed to create invoice",
      });
      actions.closeStockModal();
      actions.setCart(updatedCart);
    }
  };

  return (
    <div className="flex flex-col md:flex-row lg:flex-row h-full gap-3 md:gap-4 relative p-4">
      <Card className="py-0 ring-0 flex-1 flex flex-col min-h-0 bg-transparent shadow-none max-h-[40vh] md:max-h-[60vh] lg:max-h-none">
        <BillingSearch
          onSelectProduct={handleSelectProduct}
          initialProducts={initialProducts}
        />
      </Card>

      <Card className="w-full py-0 border-0 md:w-80 lg:w-100 flex flex-col shadow-sm overflow-hidden shrink-0 min-h-auto md:min-h-125 lg:min-h-125 max-h-[calc(100vh-16rem)] md:max-h-[calc(100vh-10rem)] lg:max-h-none sticky bottom-0 md:sticky md:top-4 lg:static bg-background z-10 rounded-t-lg md:rounded-lg">
        <BillingCart
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
        <BillingSummaryPanel
          onFinalize={openFinalizeDialog}
          isEnabled={cart.length > 0}
        />
      </Card>

      <Dialog
        open={isFinalizeDialogOpen}
        onOpenChange={(open) => setIsFinalizeDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-xl  max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirm Invoice</DialogTitle>
            <DialogDescription>
              Review all invoice details before finalizing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-semibold mt-1">{paymentMethod}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Tax Mode</p>
                <p className="font-semibold mt-1">
                  {gstEnabled ? "GST Enabled" : "Non-GST"}
                </p>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="px-3 py-2 border-b text-sm font-medium">
                Invoice Items ({cart.length})
              </div>
              <div className="divide-y">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="px-3 py-2 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-muted-foreground text-xs">
                        Qty: {item.quantity} x {tenantSettings.currency}{" "}
                        {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <MoneyText
                      amount={item.subtotal}
                      className="font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <MoneyText amount={subtotal} />
              </div>
              {gstEnabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <MoneyText amount={gstAmount} />
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Grand Total</span>
                <MoneyText amount={grandTotal} />
              </div>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm font-medium mb-3">
                Customer Details (Optional)
              </p>
              <BillingCustomerDetails />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFinalizeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleFinalizeConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Finalizing..." : "Confirm & Finalize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={isClearDialogOpen}
        title="Clear Bill"
        description="Are you sure you want to remove all items from the current bill?"
        confirmText="Clear Bill"
        isDangerous={true}
        onConfirm={() => {
          actions.resetInvoiceDraft();
        }}
        onCancel={actions.closeClearDialog}
      />

      <InvoiceStockConflictModal
        isOpen={isStockModalOpen}
        onConfirm={handleStockConflictDecision}
        onCancel={actions.closeStockModal}
      />
    </div>
  );
}
