"use client";
import clientAxios from "@/lib/axios/client";
import { useBillingTabsStore } from "@/stores/billing-tabs-store";
import { openDB } from "idb";
import { useEffect } from "react";

import type { LocalDraft } from "@/types/draft";

type SyncHandler = (draft: LocalDraft) => Promise<unknown>;

class DraftSyncManager {
  private timers = new Map<string, number>();
  private attempts = new Map<string, number>();
  private online = true;
  // attempts map tracks how many attempts have been made for a draft
  // No hard cap: retry indefinitely while component is mounted per spec
  private defaultHandler: SyncHandler | null = null;

  setDefaultHandler(h: SyncHandler) {
    this.defaultHandler = h;
  }

  setOnline(flag: boolean) {
    this.online = flag;
    if (!this.online) {
      // cancel all pending timers and retry attempts while offline
      this.stopAll();
    }
  }

  scheduleSync = (clientDraftId: string) => {
    // If offline, do not schedule sync timers per offline behavior
    if (!this.online) return;

    // clear any existing timer and schedule a new one for 1s
    this.clearTimer(clientDraftId);
    const id = window.setTimeout(() => {
      this.attempts.set(clientDraftId, 0);
      void this.attemptSync(clientDraftId);
    }, 1000);
    this.timers.set(clientDraftId, id);
  };

  cancelSync = (clientDraftId: string) => {
    this.clearTimer(clientDraftId);
    this.attempts.delete(clientDraftId);
  };

  stopAll = () => {
    for (const id of Array.from(this.timers.keys())) this.clearTimer(id);
    this.attempts.clear();
  };

  private clearTimer(clientDraftId: string) {
    const t = this.timers.get(clientDraftId);
    if (t != null) {
      clearTimeout(t);
      this.timers.delete(clientDraftId);
    }
  }

  private async readLatestDraftFromIndexedDb(
    clientDraftId: string,
  ): Promise<LocalDraft | undefined> {
    try {
      const db = await openDB("billing-app-db", 1);
      const record: any = await db.get("zustand-store", "billing-tabs-v2");
      if (!record || !record.state) return undefined;
      const drafts: LocalDraft[] = record.state.drafts ?? [];
      return drafts.find((d) => d.clientDraftId === clientDraftId);
    } catch (err) {
      console.warn("useDraftSync: reading IndexedDB failed", err);
      return undefined;
    }
  }

  private async attemptSync(clientDraftId: string) {
    // remove any scheduled timer (we're running now)
    this.clearTimer(clientDraftId);
    const attempt = (this.attempts.get(clientDraftId) ?? 0) + 1;
    this.attempts.set(clientDraftId, attempt);

    const draft = await this.readLatestDraftFromIndexedDb(clientDraftId);
    if (!draft) {
      // nothing to sync
      this.attempts.delete(clientDraftId);
      return;
    }

    const handler = this.defaultHandler ?? this.networkSync;

    try {
      await handler(draft);
      // success: cleanup
      this.attempts.delete(clientDraftId);
    } catch (err: any) {
      // If server-side 4xx, do not retry
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) {
        this.attempts.delete(clientDraftId);
        return;
      }

      // Network or unknown error: schedule retry using required schedule
      // Retry schedule: 5s, 10s, 30s, 60s, 60s, ... (repeat 60s)
      let nextDelayMs: number;
      if (attempt === 1)
        nextDelayMs = 5000; // first retry after 5s
      else if (attempt === 2)
        nextDelayMs = 10000; // second retry after 10s
      else if (attempt === 3)
        nextDelayMs = 30000; // third retry after 30s
      else nextDelayMs = 60000; // thereafter every 60s

      // small jitter to avoid exact alignment
      const jitter = Math.round(Math.random() * 1000);
      const scheduled = nextDelayMs + jitter;
      const id = window.setTimeout(() => {
        void this.attemptSync(clientDraftId);
      }, scheduled);
      this.timers.set(clientDraftId, id);
    }
  }

  // Public immediate sync entry point
  public immediateSync = (clientDraftId: string) => {
    this.clearTimer(clientDraftId);
    this.attempts.set(clientDraftId, 0);
    return this.attemptSync(clientDraftId);
  };

  // Default network sync implementation: POST to /drafts/sync using clientAxios
  private async networkSync(draft: LocalDraft) {
    if (!window) throw new Error("network unavailable");

    // Build payload per server contract — exclude local-only fields
    const payload = {
      clientDraftId: draft.clientDraftId,
      tenantId: draft.tenantId,
      outletId: draft.outletId,
      tabLabel: draft.tabLabel,
      items: draft.items,
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      paymentMethod: draft.paymentMethod,
      isDeleted: draft.isDeleted,
    };

    try {
      const res = await clientAxios.post("/drafts/sync", payload);
      const data = res.data;
      // Update store sync status to SYNCED
      try {
        useBillingTabsStore
          .getState()
          .updateSyncStatus(draft.clientDraftId, "SYNCED", null, {
            id: data.id,
            syncedAt: data.syncedAt,
            updatedAt: data.updatedAt,
          });
      } catch (e) {
        // swallow store update errors
        // eslint-disable-next-line no-console
        console.warn("useDraftSync: failed to update store on success", e);
      }
      return data;
    } catch (err: any) {
      // Distinguish network errors vs server 4xx when possible
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) {
        // Permanent server validation error — mark as SYNC_FAILED (server)
        try {
          useBillingTabsStore
            .getState()
            .updateSyncStatus(draft.clientDraftId, "SYNC_FAILED", "SERVER");
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(
            "useDraftSync: failed to update store on server error",
            e,
          );
        }
        // Do not retry
        throw err;
      }

      // Network or unknown error — mark as SYNC_FAILED (network) and allow retry
      try {
        useBillingTabsStore
          .getState()
          .updateSyncStatus(draft.clientDraftId, "SYNC_FAILED", "NETWORK");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          "useDraftSync: failed to update store on network error",
          e,
        );
      }

      throw err;
    }
  }
}

const manager = new DraftSyncManager();

// React hook wrapper: registers cleanup on unmount and returns API
export function useDraftSync(isOnline: boolean = true) {
  useEffect(() => {
    // inform manager of current connectivity
    manager.setOnline(Boolean(isOnline));

    // When coming back online, immediately sync all drafts that are pending or previously failed.
    if (isOnline) {
      try {
        const drafts = useBillingTabsStore.getState().drafts ?? [];
        for (const d of drafts) {
          if (
            !d.isDeleted &&
            (d.syncStatus === "PENDING_SYNC" || d.syncStatus === "SYNC_FAILED")
          ) {
            // immediateSync bypasses debounce (0ms) and starts retries as needed
            void manager.immediateSync(d.clientDraftId);
          }
        }
      } catch (e) {
        // ignore errors reading store
        // eslint-disable-next-line no-console
        console.warn("useDraftSync: failed to kick off immediate syncs", e);
      }
    }

    return () => {
      manager.stopAll();
    };
  }, [isOnline]);

  return {
    scheduleSync: manager.scheduleSync,
    cancelSync: manager.cancelSync,
    setSyncHandler: (h: SyncHandler) => manager.setDefaultHandler(h),
    immediateSync: (clientDraftId: string) =>
      void manager.immediateSync(clientDraftId),
  } as const;
}

export type UseDraftSyncApi = ReturnType<typeof useDraftSync>;

export default useDraftSync;
