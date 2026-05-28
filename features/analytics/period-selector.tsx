"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, AlertCircle } from "lucide-react";

interface PeriodSelectorProps {
  currentPeriod: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "last90days", label: "Last 90 Days" },
  { value: "custom", label: "Custom Range" },
];

export function PeriodSelector({
  currentPeriod,
  currentDateFrom = "",
  currentDateTo = "",
}: PeriodSelectorProps) {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);
  const [error, setError] = useState<string | null>(null);

  // Sync state with props when they change
  useEffect(() => {
    setDateFrom(currentDateFrom);
    setDateTo(currentDateTo);
    setError(null);
  }, [currentDateFrom, currentDateTo]);

  const handlePeriodChange = (value: string) => {
    setError(null);
    if (value === "custom") {
      // Just select the option locally first; we'll navigate when dates are selected
      router.push(`/analytics/revenue?period=custom`);
    } else {
      router.push(`/analytics/revenue?period=${value}`);
    }
  };

  const handleCustomDateSubmit = (from: string, to: string) => {
    if (!from || !to) return;

    const startDate = new Date(from);
    const endDate = new Date(to);

    if (startDate > endDate) {
      setError("Start date must be before end date");
      return;
    }

    setError(null);
    router.push(`/analytics/revenue?period=custom&dateFrom=${from}&dateTo=${to}`);
  };

  return (
    <div className="space-y-4">
      {/* Horizontally scrollable segmented control for mobile / beautiful pill grid for desktop */}
      <div className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-1.5 select-none w-full">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              currentPeriod === opt.value
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom Date Picker Fields */}
      {currentPeriod === "custom" && (
        <div className="p-4 border rounded-xl bg-card/40 space-y-3 max-w-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground border-b pb-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Select Calendar Range</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="dateFrom" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Start Date
              </label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  handleCustomDateSubmit(e.target.value, dateTo);
                }}
                className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <label htmlFor="dateTo" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                End Date
              </label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  handleCustomDateSubmit(dateFrom, e.target.value);
                }}
                className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>
          </div>

          {/* Validation Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium pt-1.5 animate-in shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
