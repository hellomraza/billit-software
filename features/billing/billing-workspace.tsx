"use client";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  DeficitResolutionAction,
  InsufficientItem,
  InsufficientStockModal,
} from "@/components/shared/insufficient-stock-modal";
import { Card } from "@/components/ui/card";
import { MOCK_DEFICITS, persistDeficits } from "@/lib/mock-data/deficit";
import { saveInvoice } from "@/lib/mock-data/invoice";
import { updateProductStock } from "@/lib/mock-data/product";
import { Invoice, InvoiceItem, Product } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BillingCart } from "./billing-cart";
import { BillingCustomerDetails } from "./billing-customer-details";
import { BillingSearch } from "./billing-search";
import { BillingSummaryPanel } from "./billing-summary-panel";

interface BillingWorkspaceProps {
  initialProducts: Product[];
  tenantSettings: {
    isGstEnabled: boolean;
    defaultGstRate: number;
    currency: string;
  };
}

export function BillingWorkspace({
  initialProducts,
  tenantSettings,
}: BillingWorkspaceProps) {
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Load imported products and merge with initial products
  useEffect(() => {
    const importedStr = localStorage.getItem("billit_imported_products");
    if (importedStr) {
      const importedProducts = JSON.parse(importedStr);
      // Merge: imported products first, then initial (mock) products
      setProducts([...importedProducts, ...initialProducts]);
    } else {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Stock Validation State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [conflictItems, setConflictItems] = useState<InsufficientItem[]>([]);

  const handleSelectProduct = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);

      // Stock checking immediately on add
      const requestedQty = existing ? existing.quantity + 1 : 1;
      if (requestedQty > product.currentStock) {
        toast.warning(`Insufficient inventory for ${product.name}`, {
          description: `Only ${product.currentStock} remaining in stock.`,
        });
      }

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
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
          productId: product.id,
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
    if (!tenantSettings.isGstEnabled) return 0;
    return cart.reduce(
      (sum, item) => sum + item.subtotal * (item.gstRate / 100),
      0,
    );
  }, [cart, tenantSettings.isGstEnabled]);

  const grandTotal = subtotal + gstAmount;

  const handleFinalizeInit = async () => {
    setIsFinalizing(true);
    try {
      const conflicts = cart
        .map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return {
            product,
            requested: item.quantity,
            available: product.currentStock,
          };
        })
        .filter((i) => i.requested > i.available);

      if (conflicts.length > 0) {
        setConflictItems(conflicts);
        setIsStockModalOpen(true);
      } else {
        await finalizeSuccess();
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleResolveConflicts = async (
    resolutions: { productId: string; action: DeficitResolutionAction }[],
  ) => {
    let newCart = [...cart];
    const removedItems: string[] = [];

    resolutions.forEach((res) => {
      if (res.action === "remove") {
        const item = newCart.find((i) => i.productId === res.productId);
        if (item) {
          removedItems.push(item.productName);
        }
        newCart = newCart.filter((i) => i.productId !== res.productId);
      } else if (res.action === "use-available") {
        const item = newCart.find((i) => i.productId === res.productId);
        const product = products.find((p) => p.id === res.productId);
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
      await finalizeSuccess(resolutions);

      // Show toast about removed items if any
      if (removedItems.length > 0) {
        toast.info(
          `Removed ${removedItems.length} item${removedItems.length > 1 ? "s" : ""} from bill`,
          {
            description: removedItems.join(", "),
          },
        );
      }
    } else {
      // Show warning that all items were removed
      toast.error("All items were removed", {
        description: "Your bill has been cleared. No invoice was created.",
      });
      setIsFinalizing(false);
    }
  };

  const finalizeSuccess = async (
    resolutions: { productId: string; action: DeficitResolutionAction }[] = [],
  ) => {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Generate next invoice number
    const nextInvoiceNum = parseInt(
      localStorage.getItem("billit_next_invoice_num") || "1",
    );
    const invoiceNumber = `INV-${String(nextInvoiceNum).padStart(3, "0")}`;

    // Save to localStorage for next invoice
    localStorage.setItem("billit_next_invoice_num", String(nextInvoiceNum + 1));

    // Decrement stock for all items sold
    cart.forEach((item) => {
      updateProductStock(item.productId, item.quantity);
    });

    // Log deficits for items sold at zero stock
    const deficitsCreated = resolutions.filter(
      (r) => r.action === "sell-anyway",
    );

    if (deficitsCreated.length > 0) {
      const persistedStr = localStorage.getItem("billit_deficits");
      const allDeficits = persistedStr
        ? JSON.parse(persistedStr)
        : [...MOCK_DEFICITS];

      // Create new deficit records for sold-anyway items
      deficitsCreated.forEach((res) => {
        const cartItem = cart.find((i) => i.productId === res.productId);
        if (cartItem) {
          allDeficits.push({
            id: `def_${Date.now()}_${res.productId}`,
            productId: res.productId,
            invoiceId: `inv_${Date.now()}`, // Placeholder, will be updated below
            missingQuantity: cartItem.quantity,
            status: "PENDING" as const,
            createdAt: new Date().toISOString(),
          });
        }
      });

      persistDeficits(allDeficits);
    }

    // Create invoice object
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      isGstInvoice: tenantSettings.isGstEnabled,
      paymentMethod: paymentMethod as any,
      items: cart,
      subtotal,
      totalGst: gstAmount,
      grandTotal,
    };

    // Save invoice
    saveInvoice(newInvoice);

    toast.success(`Invoice #${invoiceNumber} Finalized`, {
      description: `Total ${tenantSettings.currency} ${grandTotal.toFixed(2)} via ${paymentMethod}`,
    });

    if (deficitsCreated.length > 0) {
      toast.warning(
        `${deficitsCreated.length} inventory deficit${deficitsCreated.length > 1 ? "s" : ""} logged`,
        {
          description: `Review and resolve in Inventory Deficits section.`,
        },
      );
    }

    // Reset form
    setCart([]);
    setPaymentMethod("CASH");
    setCustomerName("");
    setCustomerPhone("");
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 relative">
      <Card className="flex-1 flex flex-col min-h-0 bg-transparent border-0 shadow-none">
        <BillingSearch
          products={products}
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
          isGstEnabled={tenantSettings.isGstEnabled}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onFinalize={handleFinalizeInit}
          onClear={() => setIsClearDialogOpen(true)}
          isEnabled={cart.length > 0}
          isFinalizing={isFinalizing}
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

      <InsufficientStockModal
        isOpen={isStockModalOpen}
        items={conflictItems}
        onResolve={handleResolveConflicts}
        onCancel={() => setIsStockModalOpen(false)}
      />
    </div>
  );
}
