"use client";

import { createProductAction } from "@/actions/products";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

const initialState = {
  error: "",
  success: "",
};

export function CreateProductForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createProductAction(prevState, formData);
      return result as { error: string; success: string };
    },
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
    }
  }, [state?.success]);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {state.error}
        </div>
      )}

      <SectionCard
        title="Product Information"
        description="Enter the basic details of your product."
        padding="md"
      >
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Coca Cola 2L"
              required
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (₹) *</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstRate">GST Rate (%) *</Label>
            <select
              id="gstRate"
              name="gstRate"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              required
              disabled={isPending}
            >
              <option value="">Select GST Rate</option>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deficitThreshold">Low Stock Threshold *</Label>
            <Input
              id="deficitThreshold"
              name="deficitThreshold"
              type="number"
              step="1"
              placeholder="10"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Alert when stock falls below this quantity
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingStock">Opening Stock</Label>
            <Input
              id="openingStock"
              name="openingStock"
              type="number"
              step="1"
              placeholder="0"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Initial quantity in the selected outlet
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="flex gap-3 max-w-2xl">
        <Button
          type="submit"
          disabled={isPending}
          className="gap-2"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Creating..." : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
