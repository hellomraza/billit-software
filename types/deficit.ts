export type DeficitStatus = "PENDING" | "RESOLVED";

export interface DeficitRecord {
  id: string;
  productId: string;
  invoiceId: string;
  missingQuantity: number;
  status: DeficitStatus;
  createdAt: string;
  resolvedAt?: string;
}
