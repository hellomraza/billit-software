"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo } from "react";
import { useBillingTabsStore } from "@/stores/billing-tabs-store";
import { formatDistanceToNow } from "date-fns";
import clientAxios from "@/lib/axios/client";
import { toast } from "sonner";

interface SavedDraftsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SavedDraftsPanel({ open, onOpenChange }: SavedDraftsPanelProps) {
  // Use the store's canonical getter for saved drafts (all non-deleted, not open)
  const getSaved = useBillingTabsStore((s) => s.getSavedDrafts);
  const saved = getSaved();
  const reopenDraft = useBillingTabsStore((s) => s.reopenDraft);
  const markDraftDeleted = useBillingTabsStore((s) => s.markDraftDeleted);
  const setState = useBillingTabsStore.setState;

  useEffect(() => {
    // noop for now
  }, [open]);

  const handleOpen = (clientDraftId: string) => {
    // Ensure the draft exists locally, then reopen as an active tab
    const local = useBillingTabsStore.getState().drafts.find((d) => d.clientDraftId === clientDraftId);
    if (!local) {
      toast.error("Draft not found locally");
      return;
    }

    reopenDraft(clientDraftId);
    toast.success("Draft opened");
    onOpenChange(false);
  };

  const handleDiscard = async (clientDraftId: string) => {
    if (!confirm("Permanently discard this bill? This cannot be undone.")) return;
    try {
      await clientAxios.delete(`/drafts/${clientDraftId}`);
      // mark deleted locally for consistency
      markDraftDeleted(clientDraftId);
      toast.success("Draft discarded");
    } catch (err: any) {
      // If server returns 4xx, inform user and do not retry; still remove locally to avoid stale UI.
      console.warn(err);
      const status = err?.response?.status;
      if (status >= 400 && status < 500) {
        toast.error("Server rejected deletion. Removing locally.");
      } else {
        toast.error("Could not contact server. Removing locally.");
      }
      setState((state) => ({ drafts: state.drafts.filter((d) => d.clientDraftId !== clientDraftId) }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Saved Bills</h3>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
            </div>

            {saved.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No saved bills. Bills you close will appear here.</div>
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
                    <div key={d.clientDraftId} className="flex items-center justify-between p-3 border rounded">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{d.tabLabel}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.items.length} item{d.items.length !== 1 ? "s" : ""} • Last updated {formatDistanceToNow(new Date(d.localUpdatedAt || d.updatedAt || d.createdAt), { addSuffix: true })}
                        </div>
                        <div className="text-sm font-semibold mt-1">{nf.format(estimatedTotal)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => handleOpen(d.clientDraftId)}>Open</Button>
                        <Button variant="destructive" onClick={() => handleDiscard(d.clientDraftId)}>Discard</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Dialog>
  );
}
