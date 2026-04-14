import { formatCurrency } from "./currency";

export function formatInvoiceNumber(prefix: string, id: string | number): string {
  const numericId = typeof id === "number" ? id : parseInt(id as string, 10) || 0;
  return `${prefix}-${numericId.toString().padStart(6, "0")}`;
}

export function formatInvoiceTotal(amount: number): string {
  return formatCurrency(amount);
}
