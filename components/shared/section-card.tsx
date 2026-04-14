import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  title?: string;
  description?: string;
}

export function SectionCard({ 
  children, 
  className, 
  padding = "md", 
  title, 
  description 
}: SectionCardProps) {
  const paddingVariants = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden", className)}>
      {(title || description) && (
        <div className={cn("border-b", paddingVariants[padding])}>
          {title && <h3 className="font-semibold leading-none tracking-tight mb-1">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className={paddingVariants[padding]}>
        {children}
      </div>
    </div>
  );
}
