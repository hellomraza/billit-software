export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatIndianAxis(val: number): string {
  if (val === 0) return "₹0";
  if (val >= 10000000) {
    return `₹${parseFloat((val / 10000000).toFixed(2))}Cr`;
  }
  if (val >= 100000) {
    return `₹${parseFloat((val / 100000).toFixed(2))}L`;
  }
  if (val >= 1000) {
    return `₹${parseFloat((val / 1000).toFixed(2))}K`;
  }
  return `₹${val}`;
}
