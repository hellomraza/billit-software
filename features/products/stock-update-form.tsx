import { updateStockAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect } from "react";
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
  const [stockState, stockFormAction, isUpdatingStock] = useActionState(
    updateStockAction,
    { error: "" },
  );

  useEffect(() => {
    if (stockState?.error) {
      toast.error("Failed to update stock", {
        description: stockState.error,
      });
    }
    if (stockState.success) {
      toast.success("Stock updated successfully");
      onClose();
    }
  }, [stockState?.error, stockState.success, onClose]);

  return (
    <form action={stockFormAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stock-quantity">New Stock Quantity</Label>
        <Input
          id="stock-quantity"
          name="quantity"
          type="number"
          min="0"
          defaultValue={currentStock}
          required
          placeholder="Enter new quantity"
          disabled={isUpdatingStock}
        />
        <Input type="hidden" name="productId" value={productId} />
        <Input type="hidden" name="outletId" value={outletId} />
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
          {isUpdatingStock ? "Updating..." : "Update Stock"}
        </Button>
      </div>
    </form>
  );
};

export default StockUpdateForm;
