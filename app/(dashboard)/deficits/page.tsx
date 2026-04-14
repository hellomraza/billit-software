import React from "react";
import { getDeficits } from "@/lib/mock-data/deficit";
import { getProducts } from "@/lib/mock-data/product";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Deficits | BillIt" };

export default async function DeficitsPage() {
  const deficits = await getDeficits();
  const products = await getProducts("", true);

  if (deficits.length === 0) {
    return (
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Deficits</h1>
          <p className="text-muted-foreground text-sm">Manage delayed stock fulfillments.</p>
        </div>
        <EmptyState 
          icon={CheckCircle2} 
          title="All clear" 
          description="There are no pending stock deficits to fulfill right now."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Deficits</h1>
        <p className="text-muted-foreground text-sm">Manage delayed stock fulfillments safely.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deficits.map(def => {
          const product = products.find(p => p.id === def.productId);
          return (
            <Card key={def.id} className={def.status === "PENDING" ? "border-warning/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <StatusBadge 
                    status={def.status === "PENDING" ? "warning" : "success"}
                    variant="secondary"
                    className="mb-2"
                  >
                    {def.status}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground font-mono">{def.invoiceId}</span>
                </div>
                <CardTitle className="text-lg">{product?.name || "Unknown Product"}</CardTitle>
                <CardDescription>
                  Missing: <span className="font-bold text-foreground">{def.missingQuantity} units</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {def.status === "PENDING" ? (
                    <Button className="w-full text-xs h-8" variant="default">
                      Acknowledge Restock
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground w-full flex items-center justify-center py-1">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-success" />
                      Resolved
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
