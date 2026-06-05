import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ColumnFiltersState } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

const ProductSearch = ({
  columnFilters,
  setColumnFilters,
}: {
  columnFilters: ColumnFiltersState;
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
}) => {
  const productFilter = columnFilters.find((f) => f.id === "name");
  const productName = (productFilter?.value as string) || "";

  const onFilterChange = (id: string, value: string) => {
    setColumnFilters((prev) =>
      prev.filter((f) => f.id !== id).concat({ id, value }),
    );
  };
  return (
    <div className="py-2 pb-4">
      <div className={cn("relative flex items-center w-full max-w-xs")}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={productName}
          onChange={(e) => onFilterChange("name", e.target.value)}
          className="px-9 h-10"
          placeholder="Search products..."
        />
        {productName && (
          <button
            onClick={() => onFilterChange("name", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            type="button"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
