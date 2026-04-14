import React from "react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "danger" | "info" | "default";

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
  variant?: "outline" | "default" | "secondary";
}

export function StatusBadge({ status, children, className, variant = "default" }: StatusBadgeProps) {
  const statusClasses = {
    success: "bg-success text-success-foreground hover:bg-success/80",
    warning: "bg-warning text-warning-foreground hover:bg-warning/80",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    info: "bg-info text-info-foreground hover:bg-info/80",
    default: "",
  };

  return (
    <Badge variant={variant} className={cn(variant === "default" && statusClasses[status], className)}>
      {children}
    </Badge>
  );
}
