"use client";

import { indexedDBStorage } from "@/lib/indexedDbStorage";
import type { BillingTabsState, LocalDraft, SyncStatus } from "@/types/draft";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

function makeEmptyDraft(
  tenantId: string,
  outletId: string,
  label: string,
  isOfflineCreated: boolean,
): LocalDraft {
  const now = new Date().toISOString();

  return {
    clientDraftId: uuidv4(),
    tenantId,
    outletId,
    tabLabel: label,
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
    isOfflineCreated,
  };
}

export const useBillingTabsStore = create<BillingTabsState>()(
  persist(
    (set, get) => ({
      drafts: [],
      openTabIds: [],
      activeTabId: "",
      tabCounter: 0,

      createTab: (tenantId, outletId) => {
        const counter = get().tabCounter + 1;
        const draft = makeEmptyDraft(
          tenantId,
          outletId,
          `Bill ${counter}`,
          !navigator.onLine,
        );

        set((state) => ({
          drafts: [...state.drafts, draft],
          openTabIds: [...state.openTabIds, draft.clientDraftId],
          activeTabId: draft.clientDraftId,
          tabCounter: counter,
        }));
      },

      switchTab: (clientDraftId) => set({ activeTabId: clientDraftId }),

      closeTab: (clientDraftId) =>
        set((state) => {
          const newOpenTabIds = state.openTabIds.filter(
            (id) => id !== clientDraftId,
          );

          let newActiveTabId = state.activeTabId;
          if (state.activeTabId === clientDraftId) {
            const idx = state.openTabIds.indexOf(clientDraftId);
            newActiveTabId =
              newOpenTabIds[Math.max(0, idx - 1)] ?? newOpenTabIds[0] ?? "";
          }

          return {
            openTabIds: newOpenTabIds,
            activeTabId: newActiveTabId,
          };
        }),

      renameTab: (clientDraftId, label) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  tabLabel: label,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      updateDraftItems: (clientDraftId, items) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  items,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      updateDraftCustomer: (clientDraftId, name, phone) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  customerName: name,
                  customerPhone: phone,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      updateDraftPayment: (clientDraftId, method) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  paymentMethod: method,
                  localUpdatedAt: new Date().toISOString(),
                  syncStatus: "PENDING_SYNC",
                }
              : d,
          ),
        })),

      clearAndResetTab: (clientDraftId, tenantId, outletId) => {
        const counter = get().tabCounter + 1;
        const newDraft = makeEmptyDraft(
          tenantId,
          outletId,
          `Bill ${counter}`,
          !navigator.onLine,
        );

        set((state) => ({
          drafts: state.drafts
            .filter((d) => d.clientDraftId !== clientDraftId)
            .concat(newDraft),
          openTabIds: state.openTabIds.map((id) =>
            id === clientDraftId ? newDraft.clientDraftId : id,
          ),
          activeTabId:
            state.activeTabId === clientDraftId
              ? newDraft.clientDraftId
              : state.activeTabId,
          tabCounter: counter,
        }));
      },

      markDraftDeleted: (clientDraftId) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId ? { ...d, isDeleted: true } : d,
          ),
          openTabIds: state.openTabIds.filter((id) => id !== clientDraftId),
          activeTabId:
            state.activeTabId === clientDraftId
              ? (state.openTabIds.filter((id) => id !== clientDraftId)[0] ?? "")
              : state.activeTabId,
        })),

      reopenDraft: (clientDraftId) =>
        set((state) => ({
          openTabIds: [...state.openTabIds, clientDraftId],
          activeTabId: clientDraftId,
        })),

      updateSyncStatus: (
        clientDraftId,
        status,
        failureType = null,
        serverData = {},
      ) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.clientDraftId === clientDraftId
              ? {
                  ...d,
                  syncStatus: status,
                  syncFailureType: failureType,
                  ...(serverData.id ? { id: serverData.id } : {}),
                  ...(serverData.syncedAt
                    ? { syncedAt: serverData.syncedAt }
                    : {}),
                  ...(serverData.updatedAt
                    ? { updatedAt: serverData.updatedAt }
                    : {}),
                }
              : d,
          ),
        })),

      hydrateDraftsFromServer: (serverDrafts) =>
        set((state) => {
          const serverMap = new Map(
            serverDrafts.map((d) => [d.clientDraftId, d]),
          );

          const updatedDrafts = state.drafts.map((local) => {
            const server = serverMap.get(local.clientDraftId);
            if (!server) return local;
            if (local.syncStatus === "PENDING_SYNC") return local;

            return {
              ...local,
              ...server,
              syncStatus: "SYNCED" as SyncStatus,
              syncFailureType: null,
              isOfflineCreated: false,
              localUpdatedAt: local.localUpdatedAt,
            };
          });

          const localIds = new Set(state.drafts.map((d) => d.clientDraftId));
          const now = new Date().toISOString();
          const newDrafts = serverDrafts
            .filter((s) => !localIds.has(s.clientDraftId))
            .map((s) => ({
              ...s,
              localUpdatedAt: s.updatedAt ?? now,
              syncStatus: "SYNCED" as SyncStatus,
              syncFailureType: null,
              isOfflineCreated: false,
            }));

          const allDrafts = [...updatedDrafts, ...newDrafts];

          const validOpenTabIds = state.openTabIds.filter((id) =>
            allDrafts.some((d) => d.clientDraftId === id && !d.isDeleted),
          );

          const serverOpenIds = serverDrafts
            .filter(
              (s) => !s.isDeleted && !validOpenTabIds.includes(s.clientDraftId),
            )
            .map((s) => s.clientDraftId);

          const newOpenTabIds = [...validOpenTabIds, ...serverOpenIds];

          return {
            drafts: allDrafts,
            openTabIds: newOpenTabIds,
            activeTabId: state.activeTabId || newOpenTabIds[0] || "",
          };
        }),

      getActiveDraft: () => {
        const { drafts, activeTabId } = get();
        return drafts.find((d) => d.clientDraftId === activeTabId);
      },

      getDraft: (clientDraftId) => {
        return get().drafts.find((d) => d.clientDraftId === clientDraftId);
      },

      getSavedDrafts: () => {
        const { drafts, openTabIds } = get();
        return drafts.filter(
          (d) => !d.isDeleted && !openTabIds.includes(d.clientDraftId),
        );
      },

      getPendingSyncDrafts: () => {
        return get().drafts.filter(
          (d) => !d.isDeleted && d.syncStatus === "PENDING_SYNC",
        );
      },
    }),
    {
      name: "billing-tabs-v2",
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
