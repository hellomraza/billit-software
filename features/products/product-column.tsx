import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatStock } from "@/lib/formatters/quantity";
import { ProductWithStock } from "@/lib/utils/products";
import { ColumnDef } from "@tanstack/react-table";
import ProductActions from "./product-actions";

export const productColumns: ColumnDef<ProductWithStock, any>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (props) => <span className="font-medium">{props.getValue()}</span>,
    filterFn: "includesString",
  },
  {
    accessorKey: "basePrice",
    header: "Base Price",
    cell: (props) => <MoneyText amount={props.getValue()} />,
  },
  {
    accessorKey: "stock",
    header: "Current Stock",
    cell: (props) => {
      const stock = props.getValue() as number;
      const isLow: boolean =
        stock > 0 && stock <= props.row.original.deficitThreshold;
      return (
        <span className={isLow ? "text-warning font-semibold" : ""}>
          {formatStock(stock, props.row.original.deficitThreshold)}
        </span>
      );
    },
  },
  {
    accessorKey: "gstRate",
    header: "GST  ",
    cell: (props) => `${props.getValue()}%`,
  },
  {
    accessorKey: "isDeleted",
    header: "Status",
    cell: (props) => {
      if (props?.getValue() === true)
        return (
          <StatusBadge status="default" variant="secondary">
            Deleted
          </StatusBadge>
        );
      return (
        <StatusBadge status="success" variant="secondary">
          Active
        </StatusBadge>
      );
    },
    filterFn: (row, id, value) => {
      const isDeleted = row.getValue(id) as boolean;
      return value.includes(isDeleted ? "deleted" : "active");
    },
    enableSorting: false,
  },
  {
    accessorKey: "action",
    header: "Actions",
    cell: (props) => <ProductActions row={props.row.original} />,
    enableSorting: false,
  },
];
