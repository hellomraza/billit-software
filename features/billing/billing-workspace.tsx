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
import { getStoredOutletId, getStoredTenant } from "@/lib/auth-tokens";
import { ProductWithStock } from "@/lib/utils/products";
import { useBillingTabsStore } from "@/store/billing-tabs-store";
import {
  useBillingActions,
  useBillingCustomerDetails,
  useBillingPaymentMethod,
} from "@/stores/billing-store";
import { useIsGstEnabled } from "@/stores/get-store";
import {
  useInvoiceActions,
  useInvoicePhase,
  useInvoiceStore,
} from "@/stores/invoice-store";
import { PaymentMethod } from "@/types";
import type { TabState } from "@/types/draft";
import { openDB } from "idb";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BillingTabBar } from "../../components/billing/billing-tab-bar";
import { BillingCart } from "./billing-cart";
import { BillingCustomerDetails } from "./billing-customer-details";
import { BillingSearch } from "./billing-search";
import { BillingSummaryPanel } from "./billing-summary-panel";
import { useBillingCart } from "./use-billing-cart";

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
  const billingCart = useBillingCart();
  const gstEnabled = useIsGstEnabled();
  const products = initialProducts;
  const cart = billingCart.items;
  const { clearCart, setItems: setBillingItems } = billingCart;
  const billingActions = useBillingActions();
  const { customerName, customerPhone } = useBillingCustomerDetails();
  const paymentMethod = useBillingPaymentMethod();
  const drafts = useBillingTabsStore((state) => state.drafts);
  const openTabIds = useBillingTabsStore((state) => state.openTabIds);
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const createTab = useBillingTabsStore((state) => state.createTab);
  const switchTab = useBillingTabsStore((state) => state.switchTab);
  const closeTab = useBillingTabsStore((state) => state.closeTab);
  const renameTab = useBillingTabsStore((state) => state.renameTab);
  const updateDraftItems = useBillingTabsStore(
    (state) => state.updateDraftItems,
  );
  const updateDraftCustomer = useBillingTabsStore(
    (state) => state.updateDraftCustomer,
  );
  const updateDraftPayment = useBillingTabsStore(
    (state) => state.updateDraftPayment,
  );
  const invoiceActions = useInvoiceActions();
  const phase = useInvoicePhase();
  const migrationAttemptedRef = useRef(false);

  const tabStates = useMemo<TabState[]>(() => {
    return drafts
      .filter(
        (draft) => openTabIds.includes(draft.clientDraftId) && !draft.isDeleted,
      )
      .map((draft) => ({
        clientDraftId: draft.clientDraftId,
        tabLabel: draft.tabLabel,
        items: draft.items,
        syncStatus: draft.syncStatus,
      }));
  }, [drafts, openTabIds]);

  useEffect(() => {
    if (migrationAttemptedRef.current || drafts.length > 0) {
      return;
    }

    migrationAttemptedRef.current = true;

    const migrateMVP1Draft = async () => {
      const tenant = getStoredTenant();
      const outletId = getStoredOutletId();
      const tenantId = tenant?._id;

      if (!tenantId || !outletId) {
        return;
      }

      const db = await openDB("billing-app-db", 1);
      const rawDraft = await db.get("zustand-store", "billing-draft");

      if (!rawDraft) {
        return;
      }

      let parsedDraft: any;
      if (typeof rawDraft === "string") {
        try {
          parsedDraft = JSON.parse(rawDraft);
        } catch {
          return;
        }
      } else {
        parsedDraft = rawDraft;
      }

      const oldState = parsedDraft?.state ?? parsedDraft;

      if (!Array.isArray(oldState?.items) || oldState.items.length === 0) {
        return;
      }

      createTab(tenantId, outletId);
      const newId = useBillingTabsStore.getState().activeTabId;

      if (!newId) {
        return;
      }

      updateDraftItems(newId, oldState.items);

      if (oldState.customerName || oldState.customerPhone) {
        updateDraftCustomer(
          newId,
          oldState.customerName ?? "",
          oldState.customerPhone ?? "",
        );
      }

      if (oldState.paymentMethod) {
        updateDraftPayment(newId, oldState.paymentMethod);
      }
    };

    migrateMVP1Draft().catch(() => {
      // Non-blocking migration path: ignore and continue with current flow.
    });
  }, [
    drafts.length,
    createTab,
    updateDraftItems,
    updateDraftCustomer,
    updateDraftPayment,
  ]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );
  const gstAmount = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + item.unitPrice * item.quantity * (item.gstRate / 100),
        0,
      ),
    [cart],
  );
  const grandTotal = gstEnabled ? subtotal + gstAmount : subtotal;

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

    billingActions.addItem({
      productId: product._id,
      productName: product.name,
      unitPrice: product.basePrice,
      gstRate: product.gstRate,
      quantity: 1,
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p._id === productId);
    const availableStock = product?.stock ?? 0;
    if (product && quantity > availableStock) {
      toast.warning(`Insufficient stock for ${product.name}`);
    }

    billingActions.updateQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: string) => {
    billingActions.removeItem(productId);
  };

  const openFinalizeDialog = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setIsFinalizeDialogOpen(true);
  };

  const syncDraftToInvoiceStore = () => {
    const normalizedPaymentMethod: PaymentMethod =
      paymentMethod === "" ? "CASH" : paymentMethod;

    invoiceActions.setCart(
      cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
        quantity: item.quantity,
        subtotal: item.unitPrice * item.quantity,
      })),
    );
    invoiceActions.setCustomerName(customerName);
    invoiceActions.setCustomerPhone(customerPhone);
    invoiceActions.setPaymentMethod(normalizedPaymentMethod);
  };

  const handleFinalizeConfirm = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    syncDraftToInvoiceStore();
    const result = await invoiceActions.submitInvoice(gstEnabled);

    if (result.success && result.phase === "success") {
      invoiceActions.resetInvoiceDraft();
      clearCart();
      setIsFinalizeDialogOpen(false);

      toast.success(`Invoice #${result.invoice?.invoiceNumber} Created`, {
        description: `Total ${tenantSettings.currency} ${result.invoice?.grandTotal.toFixed(2)} via ${paymentMethod}`,
      });
    } else if (result.phase === "stock_conflict") {
      setIsFinalizeDialogOpen(false);
      invoiceActions.openStockModal();
    } else {
      toast.error("Failed to create invoice", {
        description: result.message || "Failed to create invoice",
      });
    }
  };

  const handleNewTab = () => {
    const tenant = getStoredTenant();
    const outletId = getStoredOutletId();

    if (!tenant?._id || !outletId) {
      toast.error("Missing billing context", {
        description: "Please sign in again to create a new bill.",
      });
      return;
    }

    createTab(tenant._id, outletId);
  };

  const handleOpenDraftsPanel = () => {
    toast.info("Saved drafts panel will be added in the next billing story.");
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
        }
      }
    });

    if (updatedCart.length === 0) {
      toast.error("All items were removed", {
        description: "Your bill has been cleared. No invoice was created.",
      });
      clearCart();
      invoiceActions.resetInvoiceDraft();
      invoiceActions.closeStockModal();
      return;
    }

    setBillingItems(updatedCart);

    invoiceActions.setCart(
      updatedCart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
        quantity: item.quantity,
        subtotal: item.unitPrice * item.quantity,
      })),
    );

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

    const result = await invoiceActions.submitInvoice(gstEnabled, overrides);

    if (result.success && result.phase === "success") {
      invoiceActions.closeStockModal();
      invoiceActions.resetInvoiceDraft();
      clearCart();

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
      invoiceActions.closeStockModal();
      setBillingItems(updatedCart);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <BillingTabBar
        tabs={tabStates}
        activeTabId={
          activeTabId || tabStates[0]?.clientDraftId || "placeholder-tab"
        }
        onTabClick={(clientDraftId: string) => {
          if (clientDraftId !== "placeholder-tab") {
            switchTab(clientDraftId);
          }
        }}
        onNewTab={handleNewTab}
        onCloseTab={(clientDraftId: string) => {
          if (clientDraftId !== "placeholder-tab") {
            closeTab(clientDraftId);
          }
        }}
        onRenameTab={renameTab}
        onOpenDraftsPanel={handleOpenDraftsPanel}
      />

      <div className="relative flex flex-1 flex-col gap-3 md:flex-row lg:flex-row">
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
            subtotal={subtotal}
            gstAmount={gstAmount}
            grandTotal={grandTotal}
          />
        </Card>
      </div>

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
                      amount={item.unitPrice * item.quantity}
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
          invoiceActions.resetInvoiceDraft();
          clearCart();
        }}
        onCancel={invoiceActions.closeClearDialog}
      />

      <InvoiceStockConflictModal
        isOpen={isStockModalOpen}
        onConfirm={handleStockConflictDecision}
        onCancel={invoiceActions.closeStockModal}
      />
    </div>
  );
}
