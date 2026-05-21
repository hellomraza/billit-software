/**
 * Discount Calculation Engine
 *
 * Pure utility function for computing item and bill discounts.
 * Used identically on both client and server to ensure discrepancy-free calculations.
 *
 * All monetary values are rounded to 2 decimal places at each step using:
 * Math.round(value × 100) / 100
 */

export type DiscountType = "NONE" | "PERCENTAGE" | "FLAT";

export interface ItemInput {
  unitPrice: number;
  quantity: number;
  gstRate: number; // 0, 5, 12, 18, or 28
  itemDiscountType: DiscountType;
  itemDiscountValue: number;
}

export interface ItemResult {
  baseLineTotal: number; // unitPrice × quantity
  itemDiscountAmount: number; // computed discount in ₹ (clamped)
  discountedSubtotal: number; // baseLineTotal - itemDiscountAmount
  gstAmount: number; // discountedSubtotal × (gstRate / 100)
  lineTotal: number; // discountedSubtotal + gstAmount
}

export interface BillResult {
  items: ItemResult[];
  subtotal: number; // SUM(discountedSubtotal)
  totalGstAmount: number; // SUM(gstAmount)
  preDiscountGrandTotal: number; // subtotal + totalGstAmount
  billDiscountAmount: number; // computed bill discount in ₹ (clamped)
  grandTotal: number; // preDiscountGrandTotal - billDiscountAmount
}

/**
 * Helper function to round monetary values to 2 decimal places
 */
function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate all discount amounts for a list of items and a bill-level discount.
 *
 * @param items - Array of cart items with discount inputs
 * @param billDiscountType - Type of bill-level discount
 * @param billDiscountValue - Bill discount value
 * @param gstEnabled - Whether GST is enabled on the invoice
 * @returns BillResult with all computed amounts
 */
export function calculateDiscounts(
  items: ItemInput[],
  billDiscountType: DiscountType,
  billDiscountValue: number,
  gstEnabled: boolean,
): BillResult {
  // Calculate per-item discounts and totals
  const itemResults: ItemResult[] = items.map((item) => {
    // Step 1: Base line total (before any discounts)
    const baseLineTotal = roundToTwo(item.unitPrice * item.quantity);

    // Step 2: Calculate item discount amount
    let itemDiscountAmount = 0;
    if (item.itemDiscountType === "PERCENTAGE") {
      itemDiscountAmount = roundToTwo(
        baseLineTotal * (item.itemDiscountValue / 100),
      );
    } else if (item.itemDiscountType === "FLAT") {
      itemDiscountAmount = roundToTwo(item.itemDiscountValue);
    }
    // if NONE, itemDiscountAmount stays 0

    // Step 3: Clamp discount to not exceed base line total
    itemDiscountAmount = roundToTwo(
      Math.min(itemDiscountAmount, baseLineTotal),
    );

    // Step 4: Calculate discounted subtotal
    const discountedSubtotal = roundToTwo(baseLineTotal - itemDiscountAmount);

    // Step 5: Calculate GST amount
    const gstAmount = gstEnabled
      ? roundToTwo(discountedSubtotal * (item.gstRate / 100))
      : 0;

    // Step 6: Calculate line total
    const lineTotal = roundToTwo(discountedSubtotal + gstAmount);

    return {
      baseLineTotal,
      itemDiscountAmount,
      discountedSubtotal,
      gstAmount,
      lineTotal,
    };
  });

  // Step 7: Calculate subtotal (sum of all discounted subtotals)
  const subtotal = roundToTwo(
    itemResults.reduce((sum, result) => sum + result.discountedSubtotal, 0),
  );

  // Step 8: Calculate total GST amount
  const totalGstAmount = roundToTwo(
    itemResults.reduce((sum, result) => sum + result.gstAmount, 0),
  );

  // Step 9: Calculate pre-discount grand total
  const preDiscountGrandTotal = roundToTwo(subtotal + totalGstAmount);

  // Step 10: Calculate bill discount amount
  let billDiscountAmount = 0;
  if (billDiscountType === "PERCENTAGE") {
    billDiscountAmount = roundToTwo(
      preDiscountGrandTotal * (billDiscountValue / 100),
    );
  } else if (billDiscountType === "FLAT") {
    billDiscountAmount = roundToTwo(billDiscountValue);
  }

  // Step 11: Clamp bill discount to not exceed grand total
  billDiscountAmount = roundToTwo(
    Math.min(billDiscountAmount, preDiscountGrandTotal),
  );

  // Step 12: Calculate final grand total
  const grandTotal = roundToTwo(preDiscountGrandTotal - billDiscountAmount);

  return {
    items: itemResults,
    subtotal,
    totalGstAmount,
    preDiscountGrandTotal,
    billDiscountAmount,
    grandTotal,
  };
}
