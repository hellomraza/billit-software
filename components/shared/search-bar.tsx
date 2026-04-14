"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch: (value: string) => void;
  debounceMs?: number;
  loading?: boolean;
}

export function SearchBar({ 
  onSearch, 
  debounceMs = 300, 
  className, 
  placeholder = "Search...", 
  loading,
  ...props 
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(props.defaultValue?.toString() || "");
  const debouncedSearchTerm = useDebouncedValue(internalValue, debounceMs);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <div className={cn("relative flex items-center w-full max-w-md", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="pl-9 pr-9"
        placeholder={placeholder}
        {...props}
      />
      {internalValue && (
        <button 
          onClick={() => setInternalValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
