"use client";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Card } from "@/components/ui/card";
import { InvoiceStockConflictModal } from "@/features/invoices/invoice-stock-conflict-modal";
import { ProductWithStock } from "@/lib/utils/products";
import { useIsGstEnabled } from "@/stores/get-store";
import {
  useInvoiceActions,
  useInvoiceCarts,
  useInvoicePaymentMethod,
  useInvoiceStore,
} from "@/stores/invoice-store";
import { toast } from "sonner";
import { BillingCart } from "./billing-cart";
import { BillingCustomerDetails } from "./billing-customer-details";
import { BillingSearch } from "./billing-search";
import { BillingSummaryPanel } from "./billing-summary-panel";
import { useInvoiceCreation } from "./use-invoice-creation";

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
  const invoiceState = useInvoiceStore();
  const cart = useInvoiceCarts();
  const invoiceCreation = useInvoiceCreation();
  const actions = useInvoiceActions();
  const paymentMethod = useInvoicePaymentMethod();
  const { isClearDialogOpen, isStockModalOpen } = invoiceState;

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

  const handleFinalizeInit = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const result = await actions.submitInvoice(gstEnabled);

    if (result.success && result.phase === "success") {
      actions.resetInvoiceDraft();

      toast.success(`Invoice #${result.invoice?.invoiceNumber} Created`, {
        description: `Total ${tenantSettings.currency} ${result.invoice?.grandTotal.toFixed(2)} via ${paymentMethod}`,
      });
    } else if (result.phase === "stock_conflict") {
      // Show modal for user to decide
      actions.openStockModal();
    } else if (result.phase === "error") {
      toast.error("Failed to create invoice", {
        description: result.message || invoiceCreation.error,
      });
    }
  };

  const handleStockConflictDecision = async (
    decisions: Record<string, "use-available" | "override" | "remove">,
  ) => {
    let updatedCart = [...cart];
    const removedItems: string[] = [];

    // Apply user decisions to cart
    Object.entries(decisions).forEach(([productId, decision]) => {
      if (decision === "remove") {
        const item = updatedCart.find((i) => i.productId === productId);
        if (item) {
          removedItems.push(item.productName);
        }
        updatedCart = updatedCart.filter((i) => i.productId !== productId);
      } else if (decision === "use-available") {
        const item = updatedCart.find((i) => i.productId === productId);
        const product = products.find((p) => p._id === productId);
        if (item && product) {
          item.quantity = product.stock ?? 0;
          item.subtotal = item.quantity * item.unitPrice;
        }
      }
      // "override" means keep original quantity
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

    // Create override map for items that user chose to sell anyway
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
          {
            description: removedItems.join(", "),
          },
        );
      }
    } else if (result.phase === "stock_conflict") {
      // Another conflict (shouldn't happen but handle it)
      toast.warning("Stock conflict persists. Please review your selections.");
    } else if (result.phase === "error") {
      toast.error("Failed to create invoice", {
        description: result.message || invoiceCreation.error,
      });
      actions.closeStockModal();
      // Restore cart
      actions.setCart(updatedCart);
    }
  };

  return (
    <div className="flex flex-col md:flex-row lg:flex-row h-full gap-3 md:gap-4 relative p-4">
      {/* Search Section - Full width on mobile, flex-1 on tablet+, max height on mobile */}
      <Card className="py-0 ring-0 flex-1 flex flex-col min-h-0 bg-transparent shadow-none max-h-[40vh] md:max-h-[50vh] lg:max-h-none">
        <BillingSearch
          onSelectProduct={handleSelectProduct}
          initialProducts={initialProducts}
        />
      </Card>

      {/* Cart & Summary Section - Bottom sheet on mobile, floating on tablet, sidebar on desktop */}
      <Card className="w-full md:w-80 lg:w-100 flex flex-col shadow-sm border overflow-hidden shrink-0 min-h-auto md:min-h-125 lg:min-h-125 max-h-[calc(100vh-16rem)] md:max-h-[calc(100vh-10rem)] lg:max-h-none sticky bottom-0 md:sticky md:top-4 lg:static bg-background z-10 rounded-t-lg md:rounded-lg">
        <BillingCart
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
        <BillingCustomerDetails />
        <BillingSummaryPanel
          onFinalize={handleFinalizeInit}
          isEnabled={cart.length > 0}
        />
      </Card>

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
