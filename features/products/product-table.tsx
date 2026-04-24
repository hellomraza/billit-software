"use client";

import { DataTable } from "@/components/shared/data-table";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters/date";
import { formatStock } from "@/lib/formatters/quantity";
import { ROUTES } from "@/lib/routes";
import { ProductWithStock } from "@/lib/utils/products";
import { Edit2, Package, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface ProductTableProps {
  products: ProductWithStock[];
  showDeleted: boolean;
  onDelete: (product: ProductWithStock) => void;
  onRestore: (product: ProductWithStock) => void;
  onUpdateStock: (product: ProductWithStock) => void;
  isLoading?: boolean;
  isRestoring?: boolean;
  isUpdatingStock?: boolean;
}

export function ProductTable({
  products,
  showDeleted,
  onDelete,
  onRestore,
  onUpdateStock,
  isLoading,
  isRestoring,
  isUpdatingStock,
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
              (row.stock ?? 0) > 0 && (row.stock ?? 0) <= row.deficitThreshold;
            return (
              <span className={isLow ? "text-warning font-semibold" : ""}>
                {formatStock(row.stock ?? 0, row.deficitThreshold)}
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
          id: "createdAt",
          header: "Created",
          cell: (row) => (
            <span className="text-sm text-muted-foreground">
              {formatDate(row.createdAt)}
            </span>
          ),
        },
        {
          id: "updatedAt",
          header: "Updated",
          cell: (row) => (
            <span className="text-sm text-muted-foreground">
              {formatDate(row.updatedAt)}
            </span>
          ),
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
            if ((row.stock ?? 0) <= 0)
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
                <Link href={ROUTES.PRODUCTS_EDIT(row._id)}>
                  <Edit2 className="h-4 w-4" />
                </Link>
              </Button>
              {!row.isDeleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdateStock(row)}
                  disabled={isUpdatingStock}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label={`Update stock for ${row.name}`}
                >
                  <Package className="h-4 w-4" />
                </Button>
              )}
              {row.isDeleted ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRestore(row)}
                  disabled={isRestoring}
                  className="h-8 w-8 text-success hover:text-success hover:bg-success/10 disabled:opacity-50"
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
