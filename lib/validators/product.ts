import { Product } from "@/types";

export function validateProductName(name: string): string | null {
  if (!name.trim()) return "Product name is required.";
  if (name.length < 3) return "Product name must be at least 3 characters.";
  return null;
}

export function validatePrice(price: number): string | null {
  if (price < 0) return "Price cannot be negative.";
  return null;
}

export function validateGstRate(rate: number): string | null {
  if (rate < 0 || rate > 100) return "Invalid GST rate.";
  return null;
}

export function validateStock(qty: number): string | null {
  if (qty < 0) return "Stock cannot be negative.";
  return null;
}

export function validateProductForm(data: Partial<Product>) {
  return {
    name: validateProductName(data.name || ""),
    basePrice: validatePrice(data.basePrice || 0),
    gstRate: validateGstRate(data.gstRate || 0),
    currentStock: validateStock(data.currentStock || 0),
  };
}
