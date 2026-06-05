"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductWithStock } from "@/lib/utils/products";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { productColumns } from "./product-column";
import ProductFilter from "./product-filter";
import ProductPagination from "./product-pagination";
import ProductSorting from "./product-sorting";

interface ProductTableProps {
  products: ProductWithStock[];
}

export function ProductTable({ products }: ProductTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "isDeleted",
      value: "active",
    },
  ]);

  const table = useReactTable({
    data: products,
    columns: productColumns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  return (
    <div>
      <ProductFilter
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
      />
      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      <div className="flex items-center justify-between">
                        <p>{header.column?.columnDef?.header as string}</p>
                        {header?.column?.getCanSort() ? (
                          <ProductSorting
                            column={header.column.id}
                            toggleSorting={header.column.getToggleSortingHandler()}
                            isSorted={header.column.getIsSorted()}
                          />
                        ) : null}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ProductPagination
        onFirstPage={() => table.firstPage()}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
        onLastPage={() => table.lastPage()}
        pageIndex={table.getState().pagination.pageIndex}
        pageCount={table.getPageCount()}
      />

    </div>
  );
}