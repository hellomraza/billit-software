export interface StockWarning {
  productId: string;
  totalRequested: number;
  availableStock: number;
  tabCount: number;
}

/**
 * Compute aggregate stock warnings across open tabs.
 * Returns a Map keyed by productId with StockWarning entries for products
 * where totalRequested > availableStock.
 */
export function computeStockWarnings(
  tabs: { items: { productId: string; quantity: number }[] }[],
  stockMap: Record<string, number>,
): Map<string, StockWarning> {
  const totals = new Map<
    string,
    { totalRequested: number; tabs: Set<string> }
  >();

  for (let ti = 0; ti < tabs.length; ti++) {
    const tab = tabs[ti];
    const seenInThisTab = new Set<string>();
    for (const item of tab.items || []) {
      const cur = totals.get(item.productId) ?? {
        totalRequested: 0,
        tabs: new Set(),
      };
      cur.totalRequested += item.quantity;
      cur.tabs.add(String(ti));
      totals.set(item.productId, cur);
      seenInThisTab.add(item.productId);
    }
  }

  const warnings = new Map<string, StockWarning>();
  for (const [productId, { totalRequested, tabs }] of totals.entries()) {
    const availableStock = stockMap[productId] ?? 0;
    if (totalRequested > availableStock) {
      warnings.set(productId, {
        productId,
        totalRequested,
        availableStock,
        tabCount: tabs.size,
      });
    }
  }

  return warnings;
}
