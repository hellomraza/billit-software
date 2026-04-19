"use client";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/lib/types/api";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface EditProductFormProps {
  product: Product;
}

export function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    basePrice: product.basePrice,
    gstRate: product.gstRate,
    deficitThreshold: product.deficitThreshold,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        ["basePrice", "gstRate", "deficitThreshold"].includes(name) &&
        value !== ""
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement D.5 Update Product action
    toast.info("Product update feature coming soon (D.5)");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <SectionCard
        title="Product Information"
        description="Update the details of your product."
        padding="md"
      >
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
              value={formData.basePrice}
              onChange={handleChange}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstRate">GST Rate (%) *</Label>
            <select
              id="gstRate"
              name="gstRate"
              value={formData.gstRate}
              onChange={handleChange}
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
              value={formData.deficitThreshold}
              onChange={handleChange}
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
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
