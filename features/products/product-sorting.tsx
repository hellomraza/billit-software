import { Button } from "@/components/ui/button";
import { SortDirection } from "@tanstack/react-table";
import {
  ArrowDown01,
  ArrowDown10,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowUpDown,
} from "lucide-react";
import { JSX } from "react";

const ProductSorting = ({
  column,
  toggleSorting,
  isSorted,
}: {
  column?: string;
  toggleSorting?: (event: unknown) => void;
  isSorted: false | SortDirection;
}) => {
  const sortToIconMap: Record<string, Record<SortDirection, JSX.Element>> = {
    name: {
      asc: <ArrowDownAZ />,
      desc: <ArrowDownZA />,
    },
    basePrice: {
      asc: <ArrowDown01 />,
      desc: <ArrowDown10 />,
    },
    stock: {
      asc: <ArrowDown01 />,
      desc: <ArrowDown10 />,
    },
    gstRate: {
      asc: <ArrowDown01 />,
      desc: <ArrowDown10 />,
    },
  };

  const getSortIcon = (): JSX.Element => {
    if (!column || isSorted === false) return <ArrowUpDown />;

    const columnIcon =
      sortToIconMap[column as keyof typeof sortToIconMap][isSorted];
    if (!columnIcon) return <ArrowUpDown />;
    return columnIcon;
  };
  return (
    <div>
      <Button
        variant="secondary"
        size="icon"
        onClick={toggleSorting}
        className={"border"}
      >
        {getSortIcon()}
      </Button>
    </div>
  );
};

export default ProductSorting;
