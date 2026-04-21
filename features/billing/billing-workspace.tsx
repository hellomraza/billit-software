"use client";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Card } from "@/components/ui/card";
import { InvoiceStockConflictModal } from "@/features/invoices/invoice-stock-conflict-modal";
import { ProductWithStock } from "@/lib/utils/products";
import { useIsGstEnabled } from "@/stores/get-store";
import { InvoiceItem, Product } from "@/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BillingCart } from "./billing-cart";
import { BillingCustomerDetails } from "./billing-customer-details";
import { BillingSearch } from "./billing-search";
import { BillingSummaryPanel } from "./billing-summary-panel";
import { CartItem, useInvoiceCreation } from "./use-invoice-creation";

interface BillingWorkspaceProps {
  initialProducts: Product[];
  tenantSettings: {
    defaultGstRate: number;
    currency: string;
  };
}

export function BillingWorkspace({
  initialProducts,
  tenantSettings,
}: BillingWorkspaceProps) {
  const router = useRouter();
  const gstEnabled = useIsGstEnabled();
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const products = initialProducts;

  // Invoice creation hook
  const invoiceCreation = useInvoiceCreation();
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const handleSelectProduct = (product: ProductWithStock) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);

      // Stock checking immediately on add
      const requestedQty = existing ? existing.quantity + 1 : 1;
      const availableStock = product.stock || 0;
      if (requestedQty > availableStock) {
        toast.warning(`Insufficient inventory for ${product.name}`, {
          description: `Only ${availableStock} remaining in stock.`,
        });
      }

      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.basePrice,
          gstRate: product.gstRate,
          subtotal: product.basePrice,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.currentStock) {
      toast.warning(`Insufficient stock for ${product.name}`);
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.unitPrice }
          : item,
      ),
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.subtotal, 0),
    [cart],
  );

  const gstAmount = useMemo(() => {
    if (!gstEnabled) return 0;
    return cart.reduce(
      (sum, item) => sum + item.subtotal * (item.gstRate / 100),
      0,
    );
  }, [cart, gstEnabled]);

  const grandTotal = subtotal + gstAmount;

  const handleFinalizeInit = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Convert invoice items to cart items for the hook
    const cartItems: CartItem[] = cart.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstRate: item.gstRate,
    }));

    const result = await invoiceCreation.submitInvoice(
      cartItems,
      paymentMethod,
      customerName,
      customerPhone,
      gstEnabled,
    );

    if (result.success && invoiceCreation.phase === "success") {
      // Clear cart and redirect
      setCart([]);
      setPaymentMethod("CASH");
      setCustomerName("");
      setCustomerPhone("");

      toast.success(
        `Invoice #${invoiceCreation.createdInvoice?.invoice.invoiceNumber} Created`,
        {
          description: `Total ${tenantSettings.currency} ${invoiceCreation.createdInvoice?.invoice.grandTotal.toFixed(2)} via ${paymentMethod}`,
        },
      );

      // Navigate to invoice detail
      setTimeout(() => {
        router.push(`/invoices/${invoiceCreation.createdInvoice?.invoice.id}`);
      }, 500);
    } else if (invoiceCreation.phase === "stock_conflict") {
      // Show modal for user to decide
      setIsStockModalOpen(true);
    } else if (invoiceCreation.phase === "error") {
      toast.error("Failed to create invoice", {
        description: invoiceCreation.error,
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
        const product = products.find((p) => p.id === productId);
        if (item && product) {
          item.quantity = product.currentStock;
          item.subtotal = item.quantity * item.unitPrice;
        }
      }
      // "override" means keep original quantity
    });

    if (updatedCart.length === 0) {
      toast.error("All items were removed", {
        description: "Your bill has been cleared. No invoice was created.",
      });
      setIsStockModalOpen(false);
      return;
    }

    setCart(updatedCart);

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

    // Submit with overrides
    const cartItems: CartItem[] = updatedCart.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstRate: item.gstRate,
    }));

    const result = await invoiceCreation.submitInvoice(
      cartItems,
      paymentMethod,
      customerName,
      customerPhone,
      gstEnabled,
      overrides,
    );

    if (result.success && invoiceCreation.phase === "success") {
      setIsStockModalOpen(false);

      // Clear cart
      setCart([]);
      setPaymentMethod("CASH");
      setCustomerName("");
      setCustomerPhone("");

      toast.success(
        `Invoice #${invoiceCreation.createdInvoice?.invoice.invoiceNumber} Created`,
        {
          description: `Total ${tenantSettings.currency} ${invoiceCreation.createdInvoice?.invoice.grandTotal.toFixed(2)} via ${paymentMethod}`,
        },
      );

      if (removedItems.length > 0) {
        toast.info(
          `Removed ${removedItems.length} item${removedItems.length > 1 ? "s" : ""} from bill`,
          {
            description: removedItems.join(", "),
          },
        );
      }

      // Navigate to invoice detail
      setTimeout(() => {
        router.push(`/invoices/${invoiceCreation.createdInvoice?.invoice.id}`);
      }, 500);
    } else if (invoiceCreation.phase === "stock_conflict") {
      // Another conflict (shouldn't happen but handle it)
      toast.warning("Stock conflict persists. Please review your selections.");
    } else if (invoiceCreation.phase === "error") {
      toast.error("Failed to create invoice", {
        description: invoiceCreation.error,
      });
      setIsStockModalOpen(false);
      // Restore cart
      setCart(updatedCart);
    }
  };

  return (
    <div className="flex flex-col md:flex-row lg:flex-row h-full gap-3 md:gap-4 relative">
      {/* Search Section - Full width on mobile, flex-1 on tablet+, max height on mobile */}
      <Card className="flex-1 flex flex-col min-h-0 bg-transparent border-0 shadow-none max-h-[40vh] md:max-h-[50vh] lg:max-h-none">
        <BillingSearch
          onSelectProduct={handleSelectProduct}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </Card>

      {/* Cart & Summary Section - Bottom sheet on mobile, floating on tablet, sidebar on desktop */}
      <Card className="w-full md:w-80 lg:w-[400px] flex flex-col shadow-sm border overflow-hidden shrink-0 min-h-[auto] md:min-h-[500px] lg:min-h-[500px] max-h-[calc(100vh-16rem)] md:max-h-[calc(100vh-10rem)] lg:max-h-none sticky bottom-0 md:sticky md:top-4 lg:static bg-background z-10 rounded-t-lg md:rounded-lg">
        <BillingCart
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
        <BillingCustomerDetails
          customerName={customerName}
          customerPhone={customerPhone}
          onCustomerNameChange={setCustomerName}
          onCustomerPhoneChange={setCustomerPhone}
        />
        <BillingSummaryPanel
          subtotal={subtotal}
          gstAmount={gstAmount}
          grandTotal={grandTotal}
          isGstEnabled={gstEnabled}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onFinalize={handleFinalizeInit}
          onClear={() => setIsClearDialogOpen(true)}
          isEnabled={cart.length > 0}
          isFinalizing={invoiceCreation.phase === "submitting"}
        />
      </Card>

      <ConfirmationDialog
        isOpen={isClearDialogOpen}
        title="Clear Bill"
        description="Are you sure you want to remove all items from the current bill?"
        confirmText="Clear Bill"
        isDangerous={true}
        onConfirm={() => {
          setCart([]);
          setIsClearDialogOpen(false);
        }}
        onCancel={() => setIsClearDialogOpen(false)}
      />

      <InvoiceStockConflictModal
        isOpen={isStockModalOpen}
        items={invoiceCreation.insufficientItems}
        onConfirm={handleStockConflictDecision}
        onCancel={() => setIsStockModalOpen(false)}
        isSubmitting={invoiceCreation.phase === "submitting"}
      />
    </div>
  );
}
