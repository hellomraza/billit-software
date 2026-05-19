"use client";

import { updateStockAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type StockUpdateFormProps = {
  onClose: () => void;
  outletId: string;
  productId: string;
  currentStock: number;
};

const StockUpdateForm = ({
  onClose,
  outletId,
  productId,
  currentStock,
}: StockUpdateFormProps) => {
  const safeCurrentStock = Math.max(currentStock, 0);
  const [quantityToAdd, setQuantityToAdd] = useState("0");
  const [stockState, stockFormAction, isUpdatingStock] = useActionState(
    updateStockAction,
    { error: "" },
  );

  const parsedQuantity = Number(quantityToAdd);
  const increment = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
  const resultantStock = safeCurrentStock + increment;

  useEffect(() => {
    if (stockState?.error) {
      toast.error("Failed to update stock", {
        description: stockState.error,
      });
    }
    if (stockState.success) {
      toast.success(stockState.success, {
        description:
          stockState.currentStock !== undefined &&
          stockState.resultantStock !== undefined
            ? `Current stock: ${Math.max(stockState.currentStock, 0)}. Resultant stock: ${stockState.resultantStock}.`
            : undefined,
      });
      onClose();
    }
  }, [
    stockState?.error,
    stockState.success,
    stockState.currentStock,
    stockState.resultantStock,
    onClose,
  ]);

  return (
    <form action={stockFormAction} className="space-y-4">
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="stock-quantity">Quantity to add</Label>
          <p className="text-sm text-muted-foreground">
            This will be added to the current stock, not replace it.
          </p>
        </div>
        <Input
          id="stock-quantity"
          name="quantity"
          type="number"
          min="0"
          value={quantityToAdd}
          onChange={(event) => setQuantityToAdd(event.target.value)}
          required
          placeholder="Enter quantity to add"
          disabled={isUpdatingStock}
        />
        <Input type="hidden" name="productId" value={productId} />
        <Input type="hidden" name="outletId" value={outletId} />
        <Input type="hidden" name="currentStock" value={currentStock} />
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <p>Current stock: {safeCurrentStock}</p>
          <p>Resultant stock after add: {resultantStock}</p>
        </div>
        {stockState?.error && (
          <p className="text-sm text-destructive">{stockState.error}</p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isUpdatingStock}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isUpdatingStock} className="gap-2">
          {isUpdatingStock ? "Adding..." : "Add Stock"}
        </Button>
      </div>
    </form>
  );
};

export default StockUpdateForm;
