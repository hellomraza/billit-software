import React from "react";
import { cn } from "@/lib/utils";

interface MoneyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  currencySymbol?: string;
}

export function MoneyText({ amount, currencySymbol = "₹", className, ...props }: MoneyTextProps) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <span className={cn("font-medium tracking-tight", className)} {...props}>
      <span className="text-muted-foreground mr-0.5">{currencySymbol}</span>
      {formattedAmount}
    </span>
  );
}
