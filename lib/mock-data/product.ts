import { Product } from "@/types";
import { delay } from "./delay";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p_1",
    name: "Aashirvaad Atta 5kg",
    basePrice: 250,
    gstRate: 5,
    currentStock: 45,
    deficitThreshold: 10,
    isDeleted: false,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "p_2",
    name: "Tata Salt 1kg",
    basePrice: 24,
    gstRate: 0,
    currentStock: 120,
    deficitThreshold: 20,
    isDeleted: false,
    createdAt: "2024-01-02T10:00:00Z",
    updatedAt: "2024-01-02T10:00:00Z",
  },
  {
    id: "p_3",
    name: "Maggi Noodles Multi-pack",
    basePrice: 140,
    gstRate: 18,
    currentStock: 5, // Near deficit
    deficitThreshold: 15,
    isDeleted: false,
    createdAt: "2024-01-03T10:00:00Z",
    updatedAt: "2024-01-05T10:00:00Z",
  },
  {
    id: "p_4",
    name: "Coca Cola 2L",
    basePrice: 90,
    gstRate: 28,
    currentStock: 0, // Out of stock
    deficitThreshold: 12,
    isDeleted: false,
    createdAt: "2024-01-04T10:00:00Z",
    updatedAt: "2024-01-04T10:00:00Z",
  },
  {
    id: "p_5",
    name: "Old Discontinued Soap",
    basePrice: 30,
    gstRate: 18,
    currentStock: 0,
    deficitThreshold: 5,
    isDeleted: true,
    createdAt: "2023-01-01T10:00:00Z",
    updatedAt: "2023-06-01T10:00:00Z",
  }
];

export async function getProducts(query?: string, includeDeleted = false) {
  await delay(400);
  let products = MOCK_PRODUCTS;

  if (!includeDeleted) {
    products = products.filter(p => !p.isDeleted);
  }

  if (query) {
    const q = query.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }

  return products;
}

export async function getProductById(id: string) {
  await delay(200);
  return MOCK_PRODUCTS.find(p => p.id === id) || null;
}
