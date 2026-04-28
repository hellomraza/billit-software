"use client";
import { openDB } from "idb";
import { useEffect } from "react";

import type { LocalDraft } from "@/types/draft";

type SyncHandler = (draft: LocalDraft) => Promise<unknown>;

class DraftSyncManager {
  private timers = new Map<string, number>();
  private attempts = new Map<string, number>();
  private maxRetries = 5;
  private baseDelay = 1000; // ms
  private defaultHandler: SyncHandler | null = null;

  setDefaultHandler(h: SyncHandler) {
    this.defaultHandler = h;
  }

  scheduleSync = (clientDraftId: string) => {
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
    } catch (err) {
      // failure: schedule retry with exponential backoff
      if (attempt >= this.maxRetries) {
        this.attempts.delete(clientDraftId);
        console.error(
          "useDraftSync: max retries reached for",
          clientDraftId,
          err,
        );
        return;
      }

      const delay = this.baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.round(Math.random() * 300);
      const nextDelay = delay + jitter;
      const id = window.setTimeout(() => {
        void this.attemptSync(clientDraftId);
      }, nextDelay);
      this.timers.set(clientDraftId, id);
    }
  }

  // Public immediate sync entry point
  public immediateSync = (clientDraftId: string) => {
    this.clearTimer(clientDraftId);
    this.attempts.set(clientDraftId, 0);
    return this.attemptSync(clientDraftId);
  };

  // Default network sync implementation: POST to /drafts/sync
  private async networkSync(draft: LocalDraft) {
    if (!window || typeof window.fetch !== "function") {
      throw new Error("fetch unavailable");
    }

    const res = await fetch("/drafts/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`sync failed: ${res.status} ${txt}`);
    }
    return res.json();
  }
}

const manager = new DraftSyncManager();

// React hook wrapper: registers cleanup on unmount and returns API
export function useDraftSync() {
  useEffect(() => {
    return () => {
      manager.stopAll();
    };
  }, []);

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
