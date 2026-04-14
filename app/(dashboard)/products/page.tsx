import React from "react";
import { getProducts } from "@/lib/mock-data/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyText } from "@/components/shared/money-text";
import { Plus, Download, Search, MoreHorizontal } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Products | BillIt" };

export default async function ProductsPage() {
  const products = await getProducts("", true); // fetch all including deleted for MVP

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products Catalog</h1>
          <p className="text-muted-foreground text-sm">Manage your inventory, pricing, and tax rates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Import CSV
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9 bg-card" />
        </div>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span>Show Deleted</span>
          {/* Note: This would be a Switch component in reality */}
        </div>
      </div>

      <div className="border rounded-md bg-card">
        {products.length === 0 ? (
          <EmptyState 
            icon={Plus} 
            title="No products yet" 
            description="Add your first product or import a catalog from CSV."
            actionLabel="Add Product" 
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id} className={p.isDeleted ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><MoneyText amount={p.basePrice} /></TableCell>
                  <TableCell>
                    <span className={p.currentStock <= p.deficitThreshold ? "text-warning font-semibold" : ""}>
                      {p.currentStock}
                    </span>
                  </TableCell>
                  <TableCell>{p.gstRate}%</TableCell>
                  <TableCell>
                    {p.isDeleted ? (
                      <StatusBadge status="default" variant="secondary">Deleted</StatusBadge>
                    ) : p.currentStock <= 0 ? (
                      <StatusBadge status="danger" variant="secondary">Out of Stock</StatusBadge>
                    ) : (
                      <StatusBadge status="success" variant="secondary">Active</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
