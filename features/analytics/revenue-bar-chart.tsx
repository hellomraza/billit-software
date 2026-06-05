"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartConfig } from "@/components/ui/chart";
import { formatIndianCurrency, formatIndianAxis } from "@/lib/utils/format";
import { BarChart3 } from "lucide-react";

interface RevenueBarChartProps {
  dataPoints: Array<{
    label: string;
    netRevenue: number;
    grossRevenue: number;
    discounts: number;
    invoiceCount: number;
  }>;
  aggregation: "daily" | "weekly" | "hourly";
}

const chartConfig = {
  netRevenue: {
    label: "Net Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background border rounded-xl p-3.5 shadow-lg text-xs space-y-2 border-border/60 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
      <p className="font-bold text-foreground border-b pb-1.5 mb-1.5">{label}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground font-medium">Gross:</span>
          <span className="font-semibold text-foreground">{formatIndianCurrency(d.grossRevenue)}</span>
        </div>
        <div className="flex justify-between gap-6 text-rose-600 dark:text-rose-400">
          <span className="font-medium">Discounts:</span>
          <span className="font-semibold">−{formatIndianCurrency(d.discounts)}</span>
        </div>
        <div className="flex justify-between gap-6 border-t border-dashed pt-1.5 mt-1.5 font-bold text-foreground">
          <span>Net:</span>
          <span className="text-emerald-600 dark:text-emerald-400">{formatIndianCurrency(d.netRevenue)}</span>
        </div>
        <div className="flex justify-between gap-6 text-[10px] text-muted-foreground pt-1">
          <span className="font-medium">Invoices:</span>
          <span className="font-semibold">{d.invoiceCount} invoices</span>
        </div>
      </div>
    </div>
  );
};

export function RevenueBarChart({ dataPoints, aggregation }: RevenueBarChartProps) {
  // Handle X-axis label crowding: for daily aggregation with more than 14 data points, show every 7th label.
  const interval = aggregation === "daily" && dataPoints.length > 14 ? 6 : 0;

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {dataPoints.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
            No sales data available for this range.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={dataPoints}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                interval={interval}
                tickLine={false}
                axisLine={false}
                dy={8}
                className="font-medium text-[10px] select-none"
              />
              <YAxis
                tickFormatter={formatIndianAxis}
                tickLine={false}
                axisLine={false}
                dx={-8}
                className="font-medium text-[10px] select-none"
              />
              <ChartTooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.03)", radius: 4 }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="netRevenue"
                fill="var(--color-netRevenue)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
