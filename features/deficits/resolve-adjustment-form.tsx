"use client";

import { resolveAdjustmentAction } from "@/actions/deficits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

type ResolveAdjustmentFormProps = {
  productId: string;
  productName: string;
  onClose: () => void;
  onResolved: () => void;
};

export function ResolveAdjustmentForm({
  productId,
  productName,
  onClose,
  onResolved,
}: ResolveAdjustmentFormProps) {
  const [state, formAction, isPending] = useActionState(
    resolveAdjustmentAction,
    {
      error: "",
    },
  );

  useEffect(() => {
    if (state?.error) {
      toast.error("Failed to resolve adjustment", {
        description: state.error,
      });
      return;
    }

    if (state?.success) {
      toast.success("Adjustment recorded", {
        description: `Resolved ${state.resolved} deficit records for ${productName}.`,
      });
      onResolved();
      onClose();
    }
  }, [state, onClose, onResolved, productName]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="adjustment-reason">Reason</Label>
        <select
          id="adjustment-reason"
          name="reason"
          required
          defaultValue=""
          disabled={isPending}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Select reason
          </option>
          <option value="DAMAGE">Damage</option>
          <option value="LOSS">Loss</option>
          <option value="CORRECTION">Correction</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adjustment-notes">Notes (optional)</Label>
        <Input
          id="adjustment-notes"
          name="notes"
          type="text"
          placeholder="Write-off context or reconciliation note"
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
          {isPending ? "Saving..." : "Mark as Adjustment"}
        </Button>
      </div>
    </form>
  );
}
