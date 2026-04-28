"use client";
import type { SyncFailureType, TabState } from "@/types/draft";

type Props = {
  tabs: Array<TabState & { syncFailureType?: SyncFailureType }>;
};

export default function SyncStatusBar({ tabs }: Props) {
  const anyServerFail = tabs.some(
    (t) => t.syncStatus === "SYNC_FAILED" && t.syncFailureType === "SERVER",
  );

  const anyNetworkFail = tabs.some(
    (t) => t.syncStatus === "SYNC_FAILED" && t.syncFailureType !== "SERVER",
  );

  const anyPending = tabs.some((t) => t.syncStatus === "PENDING_SYNC");

  if (anyServerFail) {
    return (
      <div className="sync-status-bar sync-status--server" role="status">
        <div className="px-4 py-2 bg-red-600 text-white text-sm">
          Draft could not be saved. Please refresh the page.
        </div>
      </div>
    );
  }

  if (anyNetworkFail) {
    return (
      <div className="sync-status-bar sync-status--network" role="status">
        <div className="px-4 py-2 bg-amber-400 text-black text-sm">
          Draft not saved — reconnecting…
        </div>
      </div>
    );
  }

  if (anyPending) {
    return (
      <div className="sync-status-bar sync-status--pending" role="status">
        <div className="px-3 py-1 text-sm text-gray-600">Saving…</div>
      </div>
    );
  }

  return null;
}
