"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/formatters/date";
import {
  validateGstRate,
  validatePrice,
  validateProductForm,
  validateProductName,
} from "@/lib/validators/product";
import { Product } from "@/types";
import { Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { SectionCard } from "./section-card";

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: initialData.name || "",
    productCode: initialData.productCode || "",
    basePrice: initialData.basePrice || 0,
    gstRate: initialData.gstRate || 0,
    currentStock: initialData.currentStock || 0,
    deficitThreshold: initialData.deficitThreshold || 5,
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Real-time validation: validate form on every change
  const isFormValid = useMemo(() => {
    const validationErrors = validateProductForm(formData);
    return Object.values(validationErrors).every((error) => error === null);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    const newValue = [
      "basePrice",
      "gstRate",
      "currentStock",
      "deficitThreshold",
    ].includes(name)
      ? parseFloat(value) || 0
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate field in real-time
    let fieldError: string | null = null;
    if (name === "name") {
      fieldError = validateProductName(newValue as string);
    } else if (name === "basePrice") {
      fieldError = validatePrice(newValue as number);
    } else if (name === "gstRate") {
      fieldError = validateGstRate(newValue as number);
    }

    // Update errors state for this field
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Double-check form validity before submission
    const validationErrors = validateProductForm(formData);
    if (Object.values(validationErrors).some((v) => v !== null)) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  const isEditMode = !!initialData.id;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-4xl"
      aria-busy={isLoading}
      aria-label={isLoading ? "Form is submitting" : undefined}
    >
      <SectionCard
        title="Product Identity"
        description="Identify the product in your catalog."
        padding="md"
      >
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              autoFocus
              aria-invalid={errors.name ? "true" : "false"}
              className={
                errors.name
                  ? "border-destructive focus-visible:ring-destructive/20"
                  : ""
              }
            />
            {errors.name && (
              <p className="text-destructive text-sm font-medium" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="productCode">Product Code/SKU (Optional)</Label>
            <Input
              id="productCode"
              name="productCode"
              value={formData.productCode || ""}
              onChange={handleChange}
              placeholder="e.g., SKU-001, PROD-A1"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for searching and inventory tracking
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Pricing & Tax" padding="md">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.basePrice || ""}
                onChange={handleChange}
                aria-invalid={errors.basePrice ? "true" : "false"}
                className={
                  errors.basePrice
                    ? "border-destructive focus-visible:ring-destructive/20"
                    : ""
                }
              />
              {errors.basePrice && (
                <p
                  className="text-destructive text-sm font-medium"
                  role="alert"
                >
                  {errors.basePrice}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstRate">GST Rate (%)</Label>
              <select
                id="gstRate"
                name="gstRate"
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.gstRate
                    ? "border-destructive focus-visible:ring-destructive/20"
                    : "border-input"
                }`}
                value={formData.gstRate || 0}
                onChange={handleChange}
                aria-invalid={errors.gstRate ? "true" : "false"}
              >
                {[0, 5, 12, 18, 28].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
              {errors.gstRate && (
                <p
                  className="text-destructive text-sm font-medium"
                  role="alert"
                >
                  {errors.gstRate}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Inventory tracking" padding="md">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Opening Stock</Label>
              <Input
                id="currentStock"
                name="currentStock"
                type="number"
                min="0"
                value={formData.currentStock || ""}
                onChange={handleChange}
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  Adjust stock through inventory management tools.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deficitThreshold">
                Low Stock Alert Threshold
              </Label>
              <Input
                id="deficitThreshold"
                name="deficitThreshold"
                type="number"
                min="0"
                value={formData.deficitThreshold || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !isFormValid}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Product"
          )}
        </Button>
      </div>

      {isEditMode && initialData.createdAt && (
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-muted-foreground space-y-1">
            <div>Created: {formatDateTime(initialData.createdAt)}</div>
            {initialData.updatedAt && (
              <div>Last Updated: {formatDateTime(initialData.updatedAt)}</div>
            )}
          </p>
        </div>
      )}
    </form>
  );
}
