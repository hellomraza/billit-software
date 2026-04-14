export function formatQuantity(qty: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 3,
  }).format(qty);
}

export function formatStock(qty: number, threshold: number = 5): string {
  if (qty <= 0) return "Out of Stock";
  if (qty <= threshold) return `Low Stock (${formatQuantity(qty)})`;
  return formatQuantity(qty);
}
