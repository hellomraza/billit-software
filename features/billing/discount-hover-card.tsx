"use client";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import type { DiscountType } from "@/types/draft";
import { useEffect, useRef, useState } from "react";

type HoverCardTab = Exclude<DiscountType, "NONE">;

interface DiscountHoverCardProps {
  open?: boolean;
  onOpenChange?: (nextOpen: boolean) => void;
  title: string;
  subjectLabel: string;
  triggerLabel: string;
  hideTrigger?: boolean;
  currentType: DiscountType;
  currentValue: number;
  amountCap: number;
  currentSummary?: string | null;
  isReadOnly?: boolean;
  quickPicks?: number[];
  footerNote?: string;
  percentageClampMessage?: string;
  amountClampMessage?: string;
  triggerClassName?: string;
  contentClassName?: string;
  onValueChange: (discountType: HoverCardTab, discountValue: number) => void;
  onValueCommit: (discountType: HoverCardTab, discountValue: number) => void;
  onRemove: () => void;
}

export function DiscountHoverCard({
  open: controlledOpen,
  onOpenChange,
  title,
  subjectLabel,
  triggerLabel,
  currentType,
  currentValue,
  amountCap,
  currentSummary,
  isReadOnly = false,
  quickPicks = [5, 10, 15],
  hideTrigger = false,
  footerNote,
  percentageClampMessage = "Discount capped at 100%.",
  amountClampMessage = "Discount capped at total.",
  triggerClassName,
  contentClassName,
  onValueChange,
  onValueCommit,
  onRemove,
}: DiscountHoverCardProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HoverCardTab>("PERCENTAGE");
  const [percentageValue, setPercentageValue] = useState(0);
  const [amountValue, setAmountValue] = useState(0);
  const [clampMessage, setClampMessage] = useState<string | null>(null);
  const clampTimeoutRef = useRef<number | null>(null);

  const clearClampMessage = () => {
    if (clampTimeoutRef.current) {
      window.clearTimeout(clampTimeoutRef.current);
      clampTimeoutRef.current = null;
    }
    setClampMessage(null);
  };

  const syncFromCurrentValues = () => {
    const resolvedType = currentType === "FLAT" ? "FLAT" : "PERCENTAGE";
    setActiveTab(resolvedType);
    setPercentageValue(currentType === "PERCENTAGE" ? currentValue : 0);
    setAmountValue(currentType === "FLAT" ? currentValue : 0);
    clearClampMessage();
  };

  const showClampMessage = (message: string) => {
    clearClampMessage();
    setClampMessage(message);
    clampTimeoutRef.current = window.setTimeout(() => {
      setClampMessage(null);
      clampTimeoutRef.current = null;
    }, 3000) as unknown as number;
  };

  useEffect(() => {
    syncFromCurrentValues();

    return () => {
      if (clampTimeoutRef.current) {
        window.clearTimeout(clampTimeoutRef.current);
      }
    };
  }, [currentType, currentValue]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setOpen(nextOpen);
    }

    if (nextOpen) {
      syncFromCurrentValues();
    } else {
      clearClampMessage();
    }
  };

  const handleTypeChange = (nextTab: HoverCardTab) => {
    setActiveTab(nextTab);
    clearClampMessage();

    if (nextTab === "PERCENTAGE") {
      setPercentageValue(currentType === "PERCENTAGE" ? currentValue : 0);
    } else {
      setAmountValue(currentType === "FLAT" ? currentValue : 0);
    }
  };

  const handlePercentageChange = (value: number) => {
    const next = Math.max(0, value);
    setPercentageValue(next);
    clearClampMessage();
    onValueChange("PERCENTAGE", next);
  };

  const handleAmountChange = (value: number) => {
    const next = Math.max(0, value);
    setAmountValue(next);
    clearClampMessage();
    onValueChange("FLAT", next);
  };

  const handlePercentageBlur = () => {
    const clamped = Math.min(Math.max(0, percentageValue), 100);
    setPercentageValue(clamped);
    onValueCommit("PERCENTAGE", clamped);

    if (clamped < percentageValue) {
      showClampMessage(percentageClampMessage);
    }
  };

  const handleAmountBlur = () => {
    const clamped = Math.min(Math.max(0, amountValue), amountCap);
    setAmountValue(clamped);
    onValueCommit("FLAT", clamped);

    if (clamped < amountValue) {
      showClampMessage(amountClampMessage);
    }
  };

  const handleRemove = () => {
    clearClampMessage();
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setOpen(false);
    }
    setActiveTab("PERCENTAGE");
    setPercentageValue(0);
    setAmountValue(0);
    onRemove();
  };

  const handleConfirm = () => {
    clearClampMessage();
    if (activeTab === "PERCENTAGE") {
      onValueCommit("PERCENTAGE", Math.min(Math.max(0, percentageValue), 100));
    } else {
      onValueCommit("FLAT", Math.min(Math.max(0, amountValue), amountCap));
    }

    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setOpen(false);
    }
  };

  const isOpen = controlledOpen ?? open;

  return (
    <HoverCard open={isOpen} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <HoverCardTrigger
          render={(props, state) => (
            <button
              type="button"
              {...props}
              className={`text-muted-foreground hover:text-primary text-xs px-2 py-1 rounded transition-colors ${state.open ? "text-primary bg-primary/10" : ""} ${triggerClassName ?? ""}`}
              disabled={isReadOnly}
            >
              {triggerLabel}
            </button>
          )}
        />
      )}

      <HoverCardContent
        side="bottom"
        align="end"
        className={`w-80 p-0 ${contentClassName ?? ""}`}
      >
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {subjectLabel}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              {currentType !== "NONE" && currentSummary ? (
                <span className="text-xs font-medium text-amber-600">
                  {currentSummary}
                </span>
              ) : null}
              {footerNote ? (
                <span className="text-[10px] leading-none text-muted-foreground">
                  {footerNote}
                </span>
              ) : null}
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Discount type"
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
          >
            <Button
              type="button"
              role="tab"
              variant="secondary"
              aria-selected={activeTab === "PERCENTAGE"}
              onClick={() => handleTypeChange("PERCENTAGE")}
              className={`transition-colors ${activeTab === "PERCENTAGE" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              disabled={isReadOnly}
            >
              Percentage
            </Button>

            <Button
              type="button"
              role="tab"
              variant="secondary"
              aria-selected={activeTab === "FLAT"}
              onClick={() => handleTypeChange("FLAT")}
              className={`transition-colors ${activeTab === "FLAT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              disabled={isReadOnly}
            >
              Amount
            </Button>
          </div>

          {activeTab === "PERCENTAGE" ? (
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Discount percentage
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={percentageValue}
                  onChange={(e) => {
                    handlePercentageChange(Number(e.target.value || 0));
                  }}
                  onBlur={handlePercentageBlur}
                  disabled={isReadOnly}
                />
              </div>

              {quickPicks.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Quick picks
                  </div>
                  <div className="flex gap-2">
                    {quickPicks.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setPercentageValue(preset);
                          clearClampMessage();
                          onValueCommit("PERCENTAGE", preset);
                        }}
                        disabled={isReadOnly}
                      >
                        {preset}%
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Discount amount
                </label>
                <Input
                  type="number"
                  min={0}
                  max={amountCap}
                  step="0.01"
                  value={amountValue}
                  onChange={(e) => {
                    handleAmountChange(Number(e.target.value || 0));
                  }}
                  onBlur={handleAmountBlur}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          )}

          {clampMessage ? (
            <div className="mt-2 text-xs text-amber-700">{clampMessage}</div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            {currentType !== "NONE" ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleRemove}
                disabled={isReadOnly}
                className="text-rose-600 hover:text-rose-700"
              >
                Remove discount
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              size="xs"
              onClick={handleConfirm}
              disabled={isReadOnly}
            >
              {currentType === "NONE" ? "Add discount" : "Update discount"}
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
