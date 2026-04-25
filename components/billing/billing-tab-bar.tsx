"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TabState } from "@/types/draft";
import { FolderOpen, Plus } from "lucide-react";

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

export function BillingTabBar(props: BillingTabBarProps) {
  const tabs = props.tabs.length > 0 ? props.tabs : [placeholderTab];

  return (
    <div className="rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = tab.clientDraftId === props.activeTabId;
            const itemCount = tab.items.length;
            const displayLabel = truncateTabLabel(tab.tabLabel);

            return (
              <div
                key={tab.clientDraftId}
                className={cn(
                  "group/tab inline-flex shrink-0 items-center rounded-lg border px-1.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-muted/50 text-muted-foreground hover:border-border/80 hover:bg-muted hover:text-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => props.onTabClick(tab.clientDraftId)}
                  className="inline-flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  title={tab.tabLabel}
                >
                  <span className="max-w-56 truncate">{displayLabel}</span>

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
                  onClick={() => props.onCloseTab(tab.clientDraftId)}
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
    </div>
  );
}
