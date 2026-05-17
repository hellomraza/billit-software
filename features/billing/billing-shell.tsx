"use client";

import { BillingTabBar } from "@/components/billing/billing-tab-bar";
import SavedDraftsPanel from "@/components/billing/saved-drafts-panel";
import { useBillingTabs } from "@/hooks/use-billing-tabs";
import { useDraftSync } from "@/hooks/use-draft-sync";
import type { ProductWithStock } from "@/lib/utils/products";
import { useEffect, useState } from "react";
import { BillingWorkspace } from "./billing-workspace";

interface BillingShellProps {
  initialProducts: ProductWithStock[];
  tenantSettings: {
    currency: string;
  };
}

export function BillingShell({
  initialProducts,
  tenantSettings,
}: BillingShellProps) {
  const {
    tabs,
    activeTabId,
    activeDraft,
    createTab,
    switchTab,
    closeTab,
    renameTab,
    updateActiveCart,
    updateActiveCustomer,
    updateActivePayment,
    clearActiveTab,
  } = useBillingTabs();

  const { scheduleSync } = useDraftSync();
  const [draftsOpen, setDraftsOpen] = useState(false);

  useEffect(() => {
    if (!activeDraft || activeDraft.isDeleted) {
      return;
    }

    if (activeDraft.syncStatus !== "PENDING_SYNC") {
      return;
    }

    scheduleSync(activeDraft.clientDraftId);
  }, [activeDraft, scheduleSync]);

  return (
    <div className="flex h-full flex-col gap-4 p-4 ">
      <BillingTabBar
        tabs={tabs}
        activeTabId={activeTabId || tabs[0]?.clientDraftId || "placeholder-tab"}
        onTabClick={(clientDraftId: string) => {
          if (clientDraftId !== "placeholder-tab") {
            switchTab(clientDraftId);
          }
        }}
        onNewTab={createTab}
        onCloseTab={(clientDraftId: string) => {
          if (clientDraftId !== "placeholder-tab") {
            closeTab(clientDraftId);
          }
        }}
        onRenameTab={renameTab}
        onOpenDraftsPanel={() => setDraftsOpen(true)}
      />

      <SavedDraftsPanel open={draftsOpen} onOpenChange={setDraftsOpen} />

      <BillingWorkspace
        initialProducts={initialProducts}
        tenantSettings={tenantSettings}
        activeDraft={activeDraft}
        hideInternalTabBar
        onUpdateActiveCart={updateActiveCart}
        onUpdateActiveCustomer={updateActiveCustomer}
        onUpdateActivePayment={updateActivePayment}
        onClearActiveTab={clearActiveTab}
      />
    </div>
  );
}
