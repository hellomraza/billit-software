"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import clientAxios from "@/lib/axios/client";
import { useBillingTabsStore } from "@/stores/billing-tabs-store";
import { useMemo } from "react";
import { toast } from "sonner";

function formatRelativeTime(value: string) {
  const diffSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1000,
  );
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absSeconds < 60) return rtf.format(diffSeconds, "second");
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 4) return rtf.format(diffWeeks, "week");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  return rtf.format(Math.round(diffDays / 365), "year");
}

interface SavedDraftsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SavedDraftsPanel({
  open,
  onOpenChange,
}: SavedDraftsPanelProps) {
  const drafts = useBillingTabsStore((s) => s.drafts);
  const openTabIds = useBillingTabsStore((s) => s.openTabIds);
  const reopenDraft = useBillingTabsStore((s) => s.reopenDraft);
  const markDraftDeleted = useBillingTabsStore((s) => s.markDraftDeleted);
  const setState = useBillingTabsStore.setState;

  const saved = useMemo(
    () =>
      drafts.filter(
        (draft) =>
          !draft.isDeleted && !openTabIds.includes(draft.clientDraftId),
      ),
    [drafts, openTabIds],
  );

  const handleOpen = (clientDraftId: string) => {
    const local = useBillingTabsStore
      .getState()
      .drafts.find((d) => d.clientDraftId === clientDraftId);
    if (!local) return toast.error("Draft not found locally");
    reopenDraft(clientDraftId);
    toast.success("Draft opened");
    onOpenChange(false);
  };

  const handleDiscard = async (clientDraftId: string) => {
    if (!confirm("Permanently discard this bill? This cannot be undone."))
      return;
    try {
      await clientAxios.delete(`/drafts/${clientDraftId}`);
      markDraftDeleted(clientDraftId);
      toast.success("Draft discarded");
    } catch (err: any) {
      console.warn(err);
      toast.error(
        err?.response?.status >= 400 && err?.response?.status < 500
          ? "Server rejected deletion. Removing locally."
          : "Could not contact server. Removing locally.",
      );
      setState((state) => ({
        drafts: state.drafts.filter((d) => d.clientDraftId !== clientDraftId),
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] overflow-hidden p-0"
        showCloseButton={false}
      >
        <Card className="flex max-h-[85vh] flex-col overflow-hidden border-0 shadow-none">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-lg font-medium">Saved Bills</h3>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {saved.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No saved bills. Bills you close will appear here.
              </div>
            ) : (
              <div className="grid gap-3">
                {saved.map((d) => {
                  const estimatedTotal = d.items.reduce(
                    (sum, it) => sum + (it.unitPrice || 0) * (it.quantity || 0),
                    0,
                  );
                  const nf = new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  });
                  return (
                    <div
                      key={d.clientDraftId}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{d.tabLabel}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.items.length} item{d.items.length !== 1 ? "s" : ""}{" "}
                          • Last updated{" "}
                          {formatRelativeTime(
                            d.localUpdatedAt || d.updatedAt || d.createdAt,
                          )}
                        </div>
                        <div className="mt-1 text-sm font-semibold">
                          {nf.format(estimatedTotal)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => handleOpen(d.clientDraftId)}>
                          Open
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDiscard(d.clientDraftId)}
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
