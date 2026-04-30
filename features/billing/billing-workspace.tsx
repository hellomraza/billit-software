"use client";

import OfflineBanner from "@/components/billing/offline-banner";
import SavedDraftsPanel from "@/components/billing/saved-drafts-panel";
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
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getStoredOutletId, getStoredTenant } from "@/lib/auth-tokens";
import { computeStockWarnings } from "@/lib/utils/cross-tab-stock";
import { ProductWithStock } from "@/lib/utils/products";
import { useBillingTabsStore } from "@/stores/billing-tabs-store";
import { useIsGstEnabled } from "@/stores/get-store";
import {
  useInvoiceActions,
  useInvoicePhase,
  useInvoiceStore,
} from "@/stores/invoice-store";
import { PaymentMethod } from "@/types";
import type {
  DraftItem,
  PaymentMethod as DraftPaymentMethod,
  LocalDraft,
  TabState,
} from "@/types/draft";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BillingTabBar } from "../../components/billing/billing-tab-bar";
import { BillingCart } from "./billing-cart";
import { BillingCustomerDetails } from "./billing-customer-details";
import { BillingSearch } from "./billing-search";
import { BillingSummaryPanel } from "./billing-summary-panel";

interface BillingWorkspaceProps {
  initialProducts: ProductWithStock[];
  tenantSettings: {
    currency: string;
  };
  activeDraft?: LocalDraft;
  hideInternalTabBar?: boolean;
  onUpdateActiveCart?: (items: DraftItem[]) => void;
  onUpdateActiveCustomer?: (name: string, phone: string) => void;
  onUpdateActivePayment?: (method: DraftPaymentMethod) => void;
  onClearActiveTab?: () => void;
}

export function BillingWorkspace({
  initialProducts,
  tenantSettings,
  activeDraft,
  hideInternalTabBar = false,
  onUpdateActiveCart,
  onUpdateActiveCustomer,
  onUpdateActivePayment,
  onClearActiveTab,
}: BillingWorkspaceProps) {
  const router = useRouter();
  const gstEnabled = useIsGstEnabled();
  const products = initialProducts;
  const drafts = useBillingTabsStore((state) => state.drafts);
  const openTabIds = useBillingTabsStore((state) => state.openTabIds);
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const createTab = useBillingTabsStore((state) => state.createTab);
  const switchTab = useBillingTabsStore((state) => state.switchTab);
  const closeTab = useBillingTabsStore((state) => state.closeTab);
  const renameTab = useBillingTabsStore((state) => state.renameTab);
  const invoiceActions = useInvoiceActions();
  const phase = useInvoicePhase();
  const cart = useMemo<DraftItem[]>(
    () => activeDraft?.items ?? [],
    [activeDraft],
  );
  const isOnline = useOnlineStatus();
  const isReadOnly =
    !isOnline &&
    !!activeDraft &&
    activeDraft.syncStatus !== "PENDING_SYNC" &&
    !activeDraft.isOfflineCreated &&
    Boolean(activeDraft.id);
  const customerName = activeDraft?.customerName ?? "";
  const customerPhone = activeDraft?.customerPhone ?? "";
  const paymentMethod = activeDraft?.paymentMethod ?? "";
  const selectedPaymentMethod: PaymentMethod =
    paymentMethod === "" ? "CASH" : paymentMethod;

  const updateActiveCart = (nextItems: LocalDraft["items"]) => {
    if (!activeDraft) {
      return;
    }

    onUpdateActiveCart?.(nextItems);
  };

  const updateActiveCustomer = (name: string, phone: string) => {
    if (!activeDraft) {
      return;
    }

    onUpdateActiveCustomer?.(name, phone);
  };

  const updateActivePayment = (method: DraftPaymentMethod) => {
    if (!activeDraft) {
      return;
    }

    onUpdateActivePayment?.(method);
  };

  const handlePaymentMethodChange = (method: DraftPaymentMethod) => {
    if (!method) {
      return;
    }

    updateActivePayment(method);
  };

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

  // Compute stock warnings based on product stock and all open tabs
  const stockMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) {
      m[p._id] = p.stock ?? 0;
    }
    return m;
  }, [products]);

  const stockWarnings = useMemo(() => {
    return computeStockWarnings(tabStates, stockMap);
  }, [tabStates, stockMap]);

  // Attach hasStockWarning to tabStates for the tab bar
  const tabStatesWithWarnings = useMemo<TabState[]>(() => {
    return tabStates.map((tab) => {
      const has = (tab.items || []).some((it) =>
        stockWarnings.has(it.productId),
      );
      return { ...tab, hasStockWarning: has } as TabState & {
        hasStockWarning?: boolean;
      };
    });
  }, [tabStates, stockWarnings]);

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
    if (!activeDraft) {
      return;
    }

    const existing = cart.find((item) => item.productId === product._id);
    const requestedQty = existing ? existing.quantity + 1 : 1;
    const availableStock = product.stock || 0;

    if (requestedQty > availableStock) {
      toast.warning(`Insufficient inventory for ${product.name}`, {
        description: `Only ${availableStock} remaining in stock.`,
      });
    }

    updateActiveCart([
      ...cart.filter((item) => item.productId !== product._id),
      {
        productId: product._id,
        productName: product.name,
        unitPrice: product.basePrice,
        gstRate: product.gstRate,
        quantity: requestedQty,
      },
    ]);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (!activeDraft) {
      return;
    }

    const product = products.find((p) => p._id === productId);
    const availableStock = product?.stock ?? 0;
    if (product && quantity > availableStock) {
      toast.warning(`Insufficient stock for ${product.name}`);
    }

    if (quantity <= 0) {
      updateActiveCart(cart.filter((item) => item.productId !== productId));
      return;
    }

    updateActiveCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const handleRemoveItem = (productId: string) => {
    if (!activeDraft) {
      return;
    }

    updateActiveCart(cart.filter((item) => item.productId !== productId));
  };

  const openFinalizeDialog = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setIsFinalizeDialogOpen(true);
  };

  const syncDraftToInvoiceStore = () => {
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
    invoiceActions.setPaymentMethod(selectedPaymentMethod);
  };

  const handleFinalizeConfirm = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    syncDraftToInvoiceStore();
    const result = await invoiceActions.submitInvoice(
      gstEnabled,
      undefined,
      activeDraft?.clientDraftId,
    );

    if (result.success && result.phase === "success") {
      invoiceActions.resetInvoiceDraft();
      onClearActiveTab?.();
      setIsFinalizeDialogOpen(false);

      toast.success(`Invoice #${result.invoice?.invoiceNumber} Created`, {
        description: `Total ${tenantSettings.currency} ${result.invoice?.grandTotal.toFixed(2)} via ${selectedPaymentMethod}`,
        action: {
          label: "View Invoice",
          onClick: () => {
            if (result.invoice?.id) {
              router.push(`/invoices/${result.invoice.id}`);
            }
          },
        },
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
    setIsSavedDraftsOpen(true);
  };

  const [isSavedDraftsOpen, setIsSavedDraftsOpen] = useState(false);

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
      updateActiveCart([]);
      invoiceActions.resetInvoiceDraft();
      invoiceActions.closeStockModal();
      return;
    }

    updateActiveCart(updatedCart);

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

    const result = await invoiceActions.submitInvoice(
      gstEnabled,
      overrides,
      activeDraft?.clientDraftId,
    );

    if (result.success && result.phase === "success") {
      invoiceActions.closeStockModal();
      invoiceActions.resetInvoiceDraft();
      onClearActiveTab?.();

      toast.success(`Invoice #${result.invoice?.invoiceNumber} Created`, {
        description: `Total ${tenantSettings.currency} ${result.invoice?.grandTotal.toFixed(2)} via ${selectedPaymentMethod}`,
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
      updateActiveCart(updatedCart);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 max-h-[calc(100%-6rem)]">
      {!hideInternalTabBar ? (
        <BillingTabBar
          tabs={tabStatesWithWarnings}
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
      ) : null}

      <div className="relative flex h-full  flex-col gap-3 md:flex-row">
        <OfflineBanner isOnline={isOnline} className="mb-2" />
        {isReadOnly && (
          <div
            role="status"
            aria-live="polite"
            className="col-span-full rounded-md border border-muted/20 bg-muted/10 text-sm text-muted-foreground px-3 py-1 mb-2"
            title="This bill is view-only while offline"
          >
            This bill is view-only while offline.
          </div>
        )}
        <Card className="py-0 ring-0 flex-1 flex flex-col bg-transparent shadow-none ">
          <BillingSearch
            onSelectProduct={handleSelectProduct}
            initialProducts={initialProducts}
            isReadOnly={isReadOnly}
          />
        </Card>

        <Card className="w-full h-full py-0 border-0 md:w-80 lg:w-100 flex flex-col shadow-sm overflow-hidden shrink-0  sticky bottom-0 md:sticky md:top-4 lg:static bg-background z-10 rounded-t-lg md:rounded-lg">
          <BillingCart
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            stockWarnings={stockWarnings}
            isReadOnly={isReadOnly}
          />
          <BillingSummaryPanel
            onFinalize={openFinalizeDialog}
            isEnabled={cart.length > 0}
            subtotal={subtotal}
            gstAmount={gstAmount}
            grandTotal={grandTotal}
            paymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
            isReadOnly={isReadOnly}
          />
        </Card>
      </div>

      <SavedDraftsPanel
        open={isSavedDraftsOpen}
        onOpenChange={setIsSavedDraftsOpen}
      />

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
                <p className="font-semibold mt-1">{selectedPaymentMethod}</p>
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
              <BillingCustomerDetails
                customerName={customerName}
                customerPhone={customerPhone}
                onCustomerNameChange={(name) =>
                  updateActiveCustomer(name, customerPhone)
                }
                onCustomerPhoneChange={(phone) =>
                  updateActiveCustomer(customerName, phone)
                }
                isReadOnly={isReadOnly}
              />
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
          updateActiveCart([]);
          updateActiveCustomer("", "");
          updateActivePayment("CASH");
        }}
        onCancel={invoiceActions.closeClearDialog}
      />

      <InvoiceStockConflictModal
        key={isStockModalOpen ? "open" : "closed"} // Force remount to reset internal state
        isOpen={isStockModalOpen}
        onConfirm={handleStockConflictDecision}
        onCancel={invoiceActions.closeStockModal}
      />
    </div>
  );
}
