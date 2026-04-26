"use client";

import { getStoredOutletId, getStoredTenant } from "@/lib/auth-tokens";
import { useBillingTabsStore } from "@/store/billing-tabs-store";
import type {
  DraftItem,
  LocalDraft,
  PaymentMethod,
  TabState,
} from "@/types/draft";
import { openDB } from "idb";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export interface UseBillingTabsReturn {
  tabs: TabState[];
  activeTabId: string;
  activeDraft: LocalDraft | undefined;
  createTab: () => void;
  switchTab: (clientDraftId: string) => void;
  closeTab: (clientDraftId: string) => void;
  renameTab: (clientDraftId: string, newLabel: string) => void;
  updateActiveCart: (items: DraftItem[]) => void;
  updateActiveCustomer: (name: string, phone: string) => void;
  updateActivePayment: (method: PaymentMethod) => void;
  clearActiveTab: () => void;
}

function parsePersistedState(rawValue: unknown): Partial<{
  drafts: LocalDraft[];
  openTabIds: string[];
  activeTabId: string;
  tabCounter: number;
}> {
  if (!rawValue) {
    return {};
  }

  const parsed =
    typeof rawValue === "string"
      ? (() => {
          try {
            return JSON.parse(rawValue) as unknown;
          } catch {
            return null;
          }
        })()
      : rawValue;

  if (!parsed || typeof parsed !== "object") {
    return {};
  }

  const maybeState = (parsed as { state?: unknown }).state ?? parsed;
  if (!maybeState || typeof maybeState !== "object") {
    return {};
  }

  const state = maybeState as {
    drafts?: unknown;
    openTabIds?: unknown;
    activeTabId?: unknown;
    tabCounter?: unknown;
  };

  return {
    drafts: Array.isArray(state.drafts) ? (state.drafts as LocalDraft[]) : [],
    openTabIds: Array.isArray(state.openTabIds)
      ? (state.openTabIds as string[])
      : [],
    activeTabId: typeof state.activeTabId === "string" ? state.activeTabId : "",
    tabCounter:
      typeof state.tabCounter === "number" ? state.tabCounter : undefined,
  };
}

export function useBillingTabs(): UseBillingTabsReturn {
  const drafts = useBillingTabsStore((state) => state.drafts);
  const openTabIds = useBillingTabsStore((state) => state.openTabIds);
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);

  const createStoreTab = useBillingTabsStore((state) => state.createTab);
  const switchStoreTab = useBillingTabsStore((state) => state.switchTab);
  const renameStoreTab = useBillingTabsStore((state) => state.renameTab);
  const updateDraftItems = useBillingTabsStore(
    (state) => state.updateDraftItems,
  );
  const updateDraftCustomer = useBillingTabsStore(
    (state) => state.updateDraftCustomer,
  );
  const updateDraftPayment = useBillingTabsStore(
    (state) => state.updateDraftPayment,
  );
  const clearAndResetTab = useBillingTabsStore(
    (state) => state.clearAndResetTab,
  );

  const [isHydrated, setIsHydrated] = useState(
    useBillingTabsStore.persist?.hasHydrated?.() ?? true,
  );
  const initializedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = useBillingTabsStore.persist?.onFinishHydration?.(() => {
      setIsHydrated(true);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const initializeTabs = async () => {
      if (useBillingTabsStore.getState().drafts.length > 0) {
        return;
      }

      const db = await openDB("billing-app-db", 1);
      const rawState = await db.get("zustand-store", "billing-tabs-v2");
      const persistedState = parsePersistedState(rawState);
      const persistedDrafts = (persistedState.drafts ?? []).filter(
        (draft) => !draft.isDeleted,
      );

      if (persistedDrafts.length > 0) {
        const validOpenTabIds =
          (persistedState.openTabIds ?? []).filter((id) =>
            persistedDrafts.some((draft) => draft.clientDraftId === id),
          ) || [];

        const derivedOpenTabIds =
          validOpenTabIds.length > 0
            ? validOpenTabIds
            : persistedDrafts.map((draft) => draft.clientDraftId);

        const mostRecentlyUpdatedDraft = [...persistedDrafts].sort((a, b) => {
          const aUpdatedAt = new Date(
            a.updatedAt ?? a.localUpdatedAt,
          ).getTime();
          const bUpdatedAt = new Date(
            b.updatedAt ?? b.localUpdatedAt,
          ).getTime();
          return bUpdatedAt - aUpdatedAt;
        })[0];

        useBillingTabsStore.setState({
          drafts: persistedDrafts,
          openTabIds: derivedOpenTabIds,
          activeTabId:
            persistedState.activeTabId &&
            derivedOpenTabIds.includes(persistedState.activeTabId)
              ? persistedState.activeTabId
              : (mostRecentlyUpdatedDraft?.clientDraftId ??
                derivedOpenTabIds[0] ??
                ""),
          tabCounter:
            persistedState.tabCounter ??
            Math.max(derivedOpenTabIds.length, persistedDrafts.length),
        });

        return;
      }

      const tenantId = getStoredTenant()?._id;
      const outletId = getStoredOutletId();

      if (tenantId && outletId) {
        createStoreTab(tenantId, outletId);
      }
    };

    initializeTabs().catch(() => {
      // Initialization is best-effort; UI can still continue without local cache.
    });
  }, [isHydrated, createStoreTab]);

  const tabs = useMemo<TabState[]>(() => {
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

  const activeDraft = useMemo(() => {
    return drafts.find((draft) => draft.clientDraftId === activeTabId);
  }, [drafts, activeTabId]);

  const createTab = useCallback(() => {
    const tenantId = getStoredTenant()?._id;
    const outletId = getStoredOutletId();

    if (!tenantId || !outletId) {
      return;
    }

    useBillingTabsStore.setState((state) => {
      const counter = state.tabCounter + 1;
      const now = new Date().toISOString();

      const newDraft: LocalDraft = {
        clientDraftId: uuidv4(),
        tenantId,
        outletId,
        tabLabel: `Bill ${counter}`,
        items: [],
        customerName: "",
        customerPhone: "",
        paymentMethod: "",
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        localUpdatedAt: now,
        syncStatus: "PENDING_SYNC",
        syncFailureType: null,
        isOfflineCreated: !navigator.onLine,
      };

      return {
        drafts: [...state.drafts, newDraft],
        openTabIds: [...state.openTabIds, newDraft.clientDraftId],
        activeTabId: newDraft.clientDraftId,
        tabCounter: counter,
      };
    });
  }, []);

  const switchTab = useCallback(
    (clientDraftId: string) => {
      switchStoreTab(clientDraftId);
    },
    [switchStoreTab],
  );

  const closeTab = useCallback(
    (clientDraftId: string) => {
      let shouldCreateTab = false;

      useBillingTabsStore.setState((state) => {
        const currentOpenTabIds = state.openTabIds;
        const closingIndex = currentOpenTabIds.indexOf(clientDraftId);

        if (closingIndex === -1) {
          return state;
        }

        const nextOpenTabIds = currentOpenTabIds.filter(
          (id) => id !== clientDraftId,
        );

        let nextActiveTabId = state.activeTabId;
        if (state.activeTabId === clientDraftId) {
          if (nextOpenTabIds.length === 0) {
            nextActiveTabId = "";
            shouldCreateTab = true;
          } else {
            nextActiveTabId =
              nextOpenTabIds[closingIndex] ??
              nextOpenTabIds[closingIndex - 1] ??
              nextOpenTabIds[0];
          }
        }

        return {
          openTabIds: nextOpenTabIds,
          activeTabId: nextActiveTabId,
        };
      });

      if (shouldCreateTab) {
        createTab();
      }
    },
    [createTab],
  );

  const updateActiveCart = useCallback(
    (items: DraftItem[]) => {
      if (!activeTabId) {
        return;
      }

      updateDraftItems(activeTabId, items);
    },
    [activeTabId, updateDraftItems],
  );

  const updateActiveCustomer = useCallback(
    (name: string, phone: string) => {
      if (!activeTabId) {
        return;
      }

      updateDraftCustomer(activeTabId, name, phone);
    },
    [activeTabId, updateDraftCustomer],
  );

  const updateActivePayment = useCallback(
    (method: PaymentMethod) => {
      if (!activeTabId) {
        return;
      }

      updateDraftPayment(activeTabId, method);
    },
    [activeTabId, updateDraftPayment],
  );

  const clearActiveTab = useCallback(() => {
    if (!activeDraft) {
      return;
    }

    clearAndResetTab(
      activeDraft.clientDraftId,
      activeDraft.tenantId,
      activeDraft.outletId,
    );
  }, [activeDraft, clearAndResetTab]);

  return {
    tabs,
    activeTabId,
    activeDraft,
    createTab,
    switchTab,
    closeTab,
    renameTab: renameStoreTab,
    updateActiveCart,
    updateActiveCustomer,
    updateActivePayment,
    clearActiveTab,
  };
}
