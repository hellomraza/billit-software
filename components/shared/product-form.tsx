"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "./section-card";
import { validateProductForm } from "@/lib/validators/product";

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ initialData = {}, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: initialData.name || "",
    basePrice: initialData.basePrice || 0,
    gstRate: initialData.gstRate || 0,
    currentStock: initialData.currentStock || 0,
    deficitThreshold: initialData.deficitThreshold || 5,
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: ["basePrice", "gstRate", "currentStock", "deficitThreshold"].includes(name) 
        ? parseFloat(value) || 0 
        : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateProductForm(formData);
    
    if (Object.values(validationErrors).some(v => v !== null)) {
      setErrors(validationErrors);
      return;
    }
    
    onSubmit(formData);
  };

  const isEditMode = !!initialData.id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <SectionCard title="Product Identity" description="Identify the product in your catalog." padding="md">
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name || ""} 
              onChange={handleChange} 
              autoFocus 
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
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
              />
              {errors.basePrice && <p className="text-destructive text-sm">{errors.basePrice}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstRate">GST Rate (%)</Label>
              <select
                id="gstRate"
                name="gstRate"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.gstRate || 0}
                onChange={handleChange}
              >
                {[0, 5, 12, 18, 28].map(rate => (
                  <option key={rate} value={rate}>{rate}%</option>
                ))}
              </select>
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
              {isEditMode && <p className="text-xs text-muted-foreground">Adjust stock through inventory management tools.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deficitThreshold">Low Stock Alert Threshold</Label>
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
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </form>
  );
}
