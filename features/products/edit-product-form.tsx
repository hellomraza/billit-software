"use client";

import { deleteProductAction, updateProductAction } from "@/actions/products";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/lib/types/api";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface EditProductFormProps {
  product: Product;
}

const initialState = {
  error: "",
  success: "",
};

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProductAction,
    initialState,
  );

  const [isDeleting, startTransition] = useTransition();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      // Revalidate and stay on page
      setTimeout(() => {
        router.refresh();
      }, 500);
    }
  }, [state?.success, router]);

  return (
    <>
      <form action={formAction} className="space-y-6 max-w-2xl">
        {state?.error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
            {state.error}
          </div>
        )}

        <SectionCard
          title="Product Information"
          description="Update the details of your product."
          padding="md"
        >
          <div className="space-y-4 max-w-lg">
            <input type="hidden" name="productId" value={product._id} />

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product.name}
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
                defaultValue={product.basePrice}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstRate">GST Rate (%) *</Label>
              <select
                id="gstRate"
                name="gstRate"
                defaultValue={product.gstRate}
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
                defaultValue={product.deficitThreshold}
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock falls below this quantity
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Product Metadata"
          description="System information (read-only)"
          padding="md"
        >
          <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Product ID</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono text-muted-foreground">
                {product._id}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Created</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                {new Date(product.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex gap-3 max-w-2xl">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || isDeleting}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => setShowDeleteDialog(true)}
            className="ml-auto gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Product
          </Button>
        </div>
      </form>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This product will be hidden from billing but its historical references in invoices will be preserved.`}
        confirmText="Delete"
        isDangerous
        isLoading={isDeleting}
        onConfirm={() => {
          startTransition(async () => {
            deleteProductAction({ productId: product._id });
          });
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
        }}
      />
    </>
  );
}
