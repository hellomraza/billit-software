import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-sm bg-muted/30", className)}>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && <div className="text-primary/70">{icon}</div>}
        </div>
        <div>
          <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
          {trend && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend.direction === "up" ? "text-success" : "text-destructive"
            )}>
              {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
              <span className="text-muted-foreground ml-1 font-normal">from last month</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
