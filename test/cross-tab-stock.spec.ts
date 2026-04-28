import { computeStockWarnings } from "@/lib/utils/cross-tab-stock";

describe("computeStockWarnings", () => {
  it("returns empty map when no tabs", () => {
    const res = computeStockWarnings([], {});
    expect(res.size).toBe(0);
  });

  it("returns no warnings when totals <= stock", () => {
    const tabs = [
      { items: [{ productId: "p1", quantity: 2 }] },
      { items: [{ productId: "p2", quantity: 1 }] },
    ];
    const stock = { p1: 5, p2: 1 };
    const res = computeStockWarnings(tabs as any, stock);
    expect(res.size).toBe(0);
  });

  it("returns warning when single tab exceeds stock", () => {
    const tabs = [{ items: [{ productId: "p1", quantity: 10 }] }];
    const stock = { p1: 5 };
    const res = computeStockWarnings(tabs as any, stock);
    expect(res.size).toBe(1);
    const w = res.get("p1")!;
    expect(w.totalRequested).toBe(10);
    expect(w.availableStock).toBe(5);
    expect(w.tabCount).toBe(1);
  });

  it("returns warning when multiple tabs combined exceed stock", () => {
    const tabs = [
      { items: [{ productId: "p1", quantity: 6 }] },
      { items: [{ productId: "p1", quantity: 5 }] },
    ];
    const stock = { p1: 10 };
    const res = computeStockWarnings(tabs as any, stock);
    expect(res.size).toBe(1);
    const w = res.get("p1")!;
    expect(w.totalRequested).toBe(11);
    expect(w.availableStock).toBe(10);
    expect(w.tabCount).toBe(2);
  });

  it("treats missing stock as 0", () => {
    const tabs = [{ items: [{ productId: "pX", quantity: 1 }] }];
    const stock = {};
    const res = computeStockWarnings(tabs as any, stock);
    expect(res.size).toBe(1);
    const w = res.get("pX")!;
    expect(w.availableStock).toBe(0);
  });
});
