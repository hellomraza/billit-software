"use client";

import { resolveStockAdditionAction } from "@/actions/deficits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

type ResolveStockAdditionFormProps = {
  productId: string;
  suggestedQuantity: number;
  productName: string;
  onClose: () => void;
  onResolved: () => void;
};

export function ResolveStockAdditionForm({
  productId,
  suggestedQuantity,
  productName,
  onClose,
  onResolved,
}: ResolveStockAdditionFormProps) {
  const [state, formAction, isPending] = useActionState(
    resolveStockAdditionAction,
    {
      error: "",
    },
  );

  useEffect(() => {
    if (state?.error) {
      toast.error("Failed to resolve deficits", {
        description: state.error,
      });
      return;
    }

    if (state?.success) {
      toast.success("Deficit resolution recorded", {
        description:
          state.remainingQuantity > 0
            ? `Resolved ${state.resolved} units for ${productName}. Remaining deficit: ${state.remainingQuantity}.`
            : `Resolved ${state.resolved} units for ${productName}. No pending deficit left.`,
      });
      onResolved();
      onClose();
    }
  }, [state, onClose, onResolved, productName]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resolve-quantity">
          How many units did you receive?
        </Label>
        <Input
          id="resolve-quantity"
          name="quantity"
          type="number"
          min="1"
          defaultValue={Math.max(1, suggestedQuantity)}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resolve-notes">Notes (optional)</Label>
        <Input
          id="resolve-notes"
          name="notes"
          type="text"
          placeholder="Supplier receipt, manual adjustment note, etc."
          disabled={isPending}
        />
      </div>

      <Input type="hidden" name="productId" value={productId} />

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Resolving..." : "Resolve with Stock"}
        </Button>
      </div>
    </form>
  );
}
