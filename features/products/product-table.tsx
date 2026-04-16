"use client";

import { DataTable } from "@/components/shared/data-table";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatStock } from "@/lib/formatters/quantity";
import { ROUTES } from "@/lib/routes";
import { Product } from "@/types";
import { Edit2, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface ProductTableProps {
  products: Product[];
  showDeleted: boolean;
  onDelete: (product: Product) => void;
  onRestore: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductTable({
  products,
  showDeleted,
  onDelete,
  onRestore,
  isLoading,
}: ProductTableProps) {
  const visibleProducts = useMemo(() => {
    return showDeleted ? products : products.filter((p) => !p.isDeleted);
  }, [products, showDeleted]);

  return (
    <DataTable
      data={visibleProducts}
      isLoading={isLoading}
      rowClassName={(row) => (row.isDeleted ? "opacity-50" : "")}
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
          id: "price",
          header: "Base Price",
          cell: (row) => <MoneyText amount={row.basePrice} />,
        },
        {
          id: "stock",
          header: "Current Stock",
          cell: (row) => {
            const isLow =
              row.currentStock > 0 && row.currentStock <= row.deficitThreshold;
            return (
              <span className={isLow ? "text-warning font-semibold" : ""}>
                {formatStock(row.currentStock, row.deficitThreshold)}
              </span>
            );
          },
        },
        {
          id: "gst",
          header: "GST",
          cell: (row) => `${row.gstRate}%`,
        },
        {
          id: "status",
          header: "Status",
          cell: (row) => {
            if (row.isDeleted)
              return (
                <StatusBadge status="default" variant="secondary">
                  Deleted
                </StatusBadge>
              );
            if (row.currentStock <= 0)
              return (
                <StatusBadge status="danger" variant="secondary">
                  Out of Stock
                </StatusBadge>
              );
            return (
              <StatusBadge status="success" variant="secondary">
                Active
              </StatusBadge>
            );
          },
        },
        {
          id: "actions",
          header: "Actions",
          align: "right",
          cell: (row) => (
            <div
              className="flex items-center justify-end gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label={`Edit ${row.name}`}
              >
                <Link href={ROUTES.PRODUCTS_EDIT(row.id)}>
                  <Edit2 className="h-4 w-4" />
                </Link>
              </Button>
              {row.isDeleted ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRestore(row)}
                  className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                  aria-label={`Restore ${row.name}`}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(row)}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label={`Delete ${row.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
