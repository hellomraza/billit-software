import { Product } from "@/types";

let currentId = 100;

export function generateMockProduct(overrides?: Partial<Product>): Product {
  currentId++;
  const basePrice = Math.floor(Math.random() * 1000) + 10;
  
  return {
    id: `p_${currentId}`,
    name: `Mock Product ${currentId}`,
    basePrice,
    gstRate: [0, 5, 12, 18, 28][Math.floor(Math.random() * 5)],
    currentStock: Math.floor(Math.random() * 100),
    deficitThreshold: 10,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function generateMockProducts(count: number): Product[] {
  return Array.from({ length: count }, () => generateMockProduct());
}
