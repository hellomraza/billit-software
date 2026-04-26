"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TabState } from "@/types/draft";
import { AlertTriangle, FolderOpen, Plus } from "lucide-react";

interface BillingTabBarProps {
  tabs: TabState[];
  activeTabId: string;
  onTabClick: (clientDraftId: string) => void;
  onNewTab: () => void;
  onCloseTab: (clientDraftId: string) => void;
  onRenameTab: (clientDraftId: string, newLabel: string) => void;
  onOpenDraftsPanel: () => void;
}

const placeholderTab: TabState = {
  clientDraftId: "placeholder-tab",
  tabLabel: "Bill 1",
  items: [],
  syncStatus: "PENDING_SYNC",
};

const MAX_TAB_LABEL_LENGTH = 20;

function truncateTabLabel(label: string): string {
  if (label.length <= MAX_TAB_LABEL_LENGTH) {
    return label;
  }

  return `${label.slice(0, MAX_TAB_LABEL_LENGTH - 1)}…`;
}

function getSyncIndicator(syncStatus: TabState["syncStatus"]) {
  switch (syncStatus) {
    case "SYNCED":
      return {
        dotClassName: "bg-emerald-500",
        label: "Saved",
      };
    case "SYNC_FAILED":
      return {
        dotClassName: "bg-rose-500",
        label: "Save failed",
      };
    case "PENDING_SYNC":
    default:
      return {
        dotClassName: "bg-amber-500",
        label: "Saving...",
      };
  }
}

export function BillingTabBar(props: BillingTabBarProps) {
  const tabs = props.tabs.length > 0 ? props.tabs : [placeholderTab];
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [closingTabId, setClosingTabId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editingTabId || !inputRef.current) {
      return;
    }

    inputRef.current.select();
  }, [editingTabId]);

  function cancelEditing() {
    setEditingTabId(null);
    setEditingValue("");
  }

  function confirmEditing(tab: TabState) {
    const trimmedValue = editingValue.trim();

    if (trimmedValue.length > 0 && trimmedValue !== tab.tabLabel) {
      props.onRenameTab(tab.clientDraftId, trimmedValue);
    }

    cancelEditing();
  }

  function requestTabClose(tab: TabState) {
    if (tab.items.length > 0) {
      setClosingTabId(tab.clientDraftId);
      return;
    }

    props.onCloseTab(tab.clientDraftId);
  }

  function cancelCloseTab() {
    setClosingTabId(null);
  }

  function confirmCloseTab() {
    if (closingTabId) {
      props.onCloseTab(closingTabId);
    }

    setClosingTabId(null);
  }

  return (
    <div className="rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = tab.clientDraftId === props.activeTabId;
            const itemCount = tab.items.length;
            const displayLabel = truncateTabLabel(tab.tabLabel);
            const syncIndicator = getSyncIndicator(tab.syncStatus);

            return (
              <div
                key={tab.clientDraftId}
                className={cn(
                  "group/tab relative inline-flex shrink-0 items-center rounded-lg border px-1.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-border/80 hover:bg-muted hover:text-foreground",
                )}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span
                          className={cn(
                            "absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-background",
                            syncIndicator.dotClassName,
                          )}
                          aria-label={syncIndicator.label}
                        />
                      }
                    />
                    <TooltipContent>{syncIndicator.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <button
                  type="button"
                  onClick={() => props.onTabClick(tab.clientDraftId)}
                  className="inline-flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  title={tab.tabLabel}
                >
                  {tab.hasStockWarning && (
                    <AlertTriangle
                      className={cn(
                        "size-3.5 shrink-0",
                        isActive ? "text-amber-200" : "text-amber-500",
                      )}
                      aria-label="Stock warning"
                    />
                  )}

                  {editingTabId === tab.clientDraftId ? (
                    <input
                      ref={inputRef}
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          confirmEditing(tab);
                          return;
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelEditing();
                        }
                      }}
                      onBlur={() => confirmEditing(tab)}
                      onClick={(event) => event.stopPropagation()}
                      className="h-6 w-32 rounded-sm border border-border bg-background px-1.5 text-xs text-foreground outline-none"
                    />
                  ) : (
                    <span
                      className="max-w-56 truncate"
                      onDoubleClick={() => {
                        setEditingTabId(tab.clientDraftId);
                        setEditingValue(tab.tabLabel);
                      }}
                    >
                      {displayLabel}
                    </span>
                  )}

                  {itemCount > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "h-5 px-1.5 text-[0.7rem] font-semibold",
                        isActive ? "bg-primary-foreground/15 text-inherit" : "",
                      )}
                    >
                      {itemCount}
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => requestTabClose(tab)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm leading-none text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Close ${tab.tabLabel}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={props.onNewTab}
            aria-label="Create new tab"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onOpenDraftsPanel}
            className="gap-2"
          >
            <FolderOpen className="size-4" aria-hidden="true" />
            <span>Drafts</span>
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(closingTabId)}
        onOpenChange={(open) => {
          if (!open) {
            cancelCloseTab();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close this bill?</DialogTitle>
            <DialogDescription>
              This bill has items. It will be saved to your Drafts and can be
              reopened any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmCloseTab}
            >
              Close Bill
            </Button>
            <Button type="button" variant="outline" onClick={cancelCloseTab}>
              Keep Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
