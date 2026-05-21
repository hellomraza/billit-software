import { Switch } from "@/components/ui/switch";
import { ColumnFiltersState } from "@tanstack/react-table";
import { Dispatch, SetStateAction } from "react";
import ProductSearch from "./product-search";

const ProductFilter = ({
  columnFilters,
  setColumnFilters,
}: {
  columnFilters: ColumnFiltersState;
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
}) => {
  const switchValue = columnFilters.find((f) => f.id === "isDeleted")
    ?.value as string;
  return (
    <div className="flex items-center gap-4">
      <ProductSearch
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
      />
      <div className="flex items-center">
        <Switch
          checked={switchValue === "deleted"}
          onCheckedChange={(checked) => {
            setColumnFilters((prev) => {
              const newFilters = prev.filter((f) => f.id !== "isDeleted");
              newFilters.push({
                id: "isDeleted",
                value: checked ? "deleted" : "active",
              });
              return newFilters;
            });
          }}
        />
        <span className="ml-2 text-sm">Show Deleted</span>
      </div>
    </div>
  );
};

export default ProductFilter;
