"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React from "react";

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div
        className="border rounded-md bg-card overflow-hidden"
        aria-busy="true"
        role="status"
        aria-label="Loading table data"
      >
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className,
                  )}
                >
                  <Skeleton className="h-4 w-20 rounded" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((rowNum) => (
              <TableRow
                key={`skeleton-${rowNum}`}
                className="animate-in fade-in duration-300"
                style={{ animationDelay: `${rowNum * 50}ms` }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${rowNum}-${col.id}`}
                    className={cn(
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                    )}
                  >
                    <Skeleton className="h-4 w-full rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div
      className="border rounded-md bg-card overflow-x-auto animate-in fade-in duration-500"
      aria-busy="false"
    >
      <div className="min-w-full">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "animate-in fade-in duration-300 transition-colors",
                    onRowClick &&
                      "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    rowClassName?.(row),
                  )}
                  style={{ animationDelay: `${rowIndex * 30}ms` }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={`${rowIndex}-${col.id}`}
                      className={cn(
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                      )}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? String(row[col.accessorKey])
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
