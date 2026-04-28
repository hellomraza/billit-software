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
  const drafts = useBillingTabsStore((s) => s.drafts);
  const openTabIds = useBillingTabsStore((s) => s.openTabIds);
  const reopenDraft = useBillingTabsStore((s) => s.reopenDraft);
  const setState = useBillingTabsStore.setState;

  const saved = useMemo(() => {
    return drafts.filter((d) => !d.isDeleted && !openTabIds.includes(d.clientDraftId));
  }, [drafts, openTabIds]);

  useEffect(() => {
    // noop for now
  }, [open]);

  const handleOpen = (clientDraftId: string) => {
    reopenDraft(clientDraftId);
    onOpenChange(false);
  };

  const handleDiscard = async (clientDraftId: string) => {
    if (!confirm("Permanently discard this bill? This cannot be undone.")) return;
    try {
      await clientAxios.delete(`/drafts/${clientDraftId}`);
    } catch (err) {
      // ignore server errors but notify user
      console.warn(err);
      toast.error("Failed to notify server about discard. Proceeding locally.");
    }

    // Remove locally from persisted store
    setState((state) => ({ drafts: state.drafts.filter((d) => d.clientDraftId !== clientDraftId) }));
    toast.success("Draft discarded");
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
                {saved.map((d) => (
                  <div key={d.clientDraftId} className="flex items-center justify-between p-3 border rounded">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{d.tabLabel}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.items.length} item{d.items.length !== 1 ? "s" : ""} • Last updated {formatDistanceToNow(new Date(d.localUpdatedAt || d.updatedAt || d.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleOpen(d.clientDraftId)}>Open</Button>
                      <Button variant="destructive" onClick={() => handleDiscard(d.clientDraftId)}>Discard</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Dialog>
  );
}
