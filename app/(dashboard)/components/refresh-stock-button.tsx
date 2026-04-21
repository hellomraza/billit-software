"use client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import React from "react";

const RefreshStockButton = () => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 h-9 px-3 text-xs sm:text-sm"
      aria-label="Refresh stock levels"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">
        {isRefreshing ? "Refreshing..." : "Refresh Stock"}
      </span>
      <span className="sm:hidden">{isRefreshing ? "..." : "Stock"}</span>
    </Button>
  );
};

export default RefreshStockButton;
