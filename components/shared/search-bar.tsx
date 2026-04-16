"use client";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { Loader2, Search, X } from "lucide-react";
import React, { forwardRef, useEffect, useState } from "react";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch: (value: string) => void;
  debounceMs?: number;
  loading?: boolean;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      onSearch,
      debounceMs = 300,
      className,
      placeholder = "Search...",
      loading,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(
      props.defaultValue?.toString() || "",
    );
    const debouncedSearchTerm = useDebouncedValue(internalValue, debounceMs);

    useEffect(() => {
      onSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearch]);

    return (
      <div
        className={cn("relative flex items-center w-full max-w-md", className)}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={ref}
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          className="pl-9 pr-9"
          placeholder={placeholder}
          {...props}
        />
        {internalValue && !loading && (
          <button
            onClick={() => setInternalValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            type="button"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export { SearchBar };
