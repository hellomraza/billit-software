export interface Product {
  id: string;
  name: string;
  basePrice: number;
  gstRate: number; // 0, 5, 12, 18, 28
  currentStock: number;
  deficitThreshold: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
