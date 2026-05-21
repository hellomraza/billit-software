/**
 * Unit tests for the discount calculator utility
 * Testing the canonical formula implementation
 */

import {
  calculateDiscounts,
  DiscountType,
  ItemInput,
  BillResult,
} from '../discount-calculator';

describe('Discount Calculator (Frontend)', () => {
  /**
   * Test 1: No discounts - should equal plain price × quantity
   */
  test('should handle no discounts correctly', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 18,
        itemDiscountType: 'NONE',
        itemDiscountValue: 0,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items[0].baseLineTotal).toBe(300);
    expect(result.items[0].itemDiscountAmount).toBe(0);
    expect(result.items[0].discountedSubtotal).toBe(300);
    expect(result.items[0].gstAmount).toBe(54); // 300 × 0.18
    expect(result.items[0].lineTotal).toBe(354);
    expect(result.grandTotal).toBe(354);
  });

  /**
   * Test 2: PERCENTAGE item discount with GST enabled
   * 10% off ₹100 item × 3 = ₹30 discount, ₹270 discounted subtotal
   */
  test('should apply PERCENTAGE item discount correctly', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 18,
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 10,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items[0].baseLineTotal).toBe(300);
    expect(result.items[0].itemDiscountAmount).toBe(30); // 300 × 10%
    expect(result.items[0].discountedSubtotal).toBe(270);
    expect(result.items[0].gstAmount).toBe(48.6); // 270 × 0.18
    expect(result.items[0].lineTotal).toBe(318.6);
    expect(result.subtotal).toBe(270);
    expect(result.grandTotal).toBe(318.6);
  });

  /**
   * Test 3: FLAT item discount
   * ₹30 off ₹300 item total = ₹270 discounted subtotal
   */
  test('should apply FLAT item discount correctly', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 12,
        itemDiscountType: 'FLAT',
        itemDiscountValue: 30,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items[0].baseLineTotal).toBe(300);
    expect(result.items[0].itemDiscountAmount).toBe(30);
    expect(result.items[0].discountedSubtotal).toBe(270);
    expect(result.items[0].gstAmount).toBe(32.4); // 270 × 0.12
    expect(result.items[0].lineTotal).toBe(302.4);
    expect(result.grandTotal).toBe(302.4);
  });

  /**
   * Test 4: FLAT item discount clamped
   * ₹500 flat discount on a ₹200 item → discount = ₹200, discounted subtotal = ₹0
   */
  test('should clamp FLAT item discount to item total', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 2,
        gstRate: 18,
        itemDiscountType: 'FLAT',
        itemDiscountValue: 500,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items[0].baseLineTotal).toBe(200);
    expect(result.items[0].itemDiscountAmount).toBe(200); // clamped
    expect(result.items[0].discountedSubtotal).toBe(0);
    expect(result.items[0].gstAmount).toBe(0); // 0 × 0.18
    expect(result.items[0].lineTotal).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  /**
   * Test 5: PERCENTAGE bill discount
   * 10% off ₹500 preDiscountGrandTotal = ₹50 bill discount, ₹450 grandTotal
   */
  test('should apply PERCENTAGE bill discount correctly', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 5,
        gstRate: 0, // no GST for simpler math
        itemDiscountType: 'NONE',
        itemDiscountValue: 0,
      },
    ];

    const result = calculateDiscounts(items, 'PERCENTAGE', 10, false);

    expect(result.subtotal).toBe(500);
    expect(result.billDiscountAmount).toBe(50); // 500 × 10%
    expect(result.grandTotal).toBe(450);
  });

  /**
   * Test 6: FLAT bill discount clamped
   * ₹1000 flat on ₹500 total → discount = ₹500, grandTotal = ₹0
   */
  test('should clamp FLAT bill discount to grand total', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 5,
        gstRate: 0,
        itemDiscountType: 'NONE',
        itemDiscountValue: 0,
      },
    ];

    const result = calculateDiscounts(items, 'FLAT', 1000, false);

    expect(result.preDiscountGrandTotal).toBe(500);
    expect(result.billDiscountAmount).toBe(500); // clamped
    expect(result.grandTotal).toBe(0);
  });

  /**
   * Test 7: GST enabled
   * 18% GST on ₹270 discounted subtotal = ₹48.60 gstAmount
   */
  test('should calculate GST correctly when enabled', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 18,
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 10,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items[0].discountedSubtotal).toBe(270);
    expect(result.items[0].gstAmount).toBe(48.6); // 270 × 0.18
    expect(result.totalGstAmount).toBe(48.6);
  });

  /**
   * Test 8: GST disabled
   * All gstAmounts = 0
   */
  test('should not calculate GST when disabled', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 18,
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 10,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, false);

    expect(result.items[0].gstAmount).toBe(0);
    expect(result.totalGstAmount).toBe(0);
    expect(result.grandTotal).toBe(270);
  });

  /**
   * Test 9: 100% percentage discount on an item
   * itemDiscountAmount = baseLineTotal, discountedSubtotal = 0
   */
  test('should allow 100% item discount (free item)', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 18,
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 100,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items[0].baseLineTotal).toBe(300);
    expect(result.items[0].itemDiscountAmount).toBe(300);
    expect(result.items[0].discountedSubtotal).toBe(0);
    expect(result.items[0].gstAmount).toBe(0);
    expect(result.items[0].lineTotal).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  /**
   * Test 10: Multiple items with mixed discounts
   */
  test('should calculate multiple items with different discount types', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 2,
        gstRate: 18,
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 10,
      },
      {
        unitPrice: 50,
        quantity: 4,
        gstRate: 12,
        itemDiscountType: 'FLAT',
        itemDiscountValue: 20,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    // Item 1: 100×2 = 200, 10% discount = 20, discounted = 180, GST 18% = 32.4, total = 212.4
    expect(result.items[0].baseLineTotal).toBe(200);
    expect(result.items[0].itemDiscountAmount).toBe(20);
    expect(result.items[0].discountedSubtotal).toBe(180);
    expect(result.items[0].gstAmount).toBe(32.4);
    expect(result.items[0].lineTotal).toBe(212.4);

    // Item 2: 50×4 = 200, flat 20 discount, discounted = 180, GST 12% = 21.6, total = 201.6
    expect(result.items[1].baseLineTotal).toBe(200);
    expect(result.items[1].itemDiscountAmount).toBe(20);
    expect(result.items[1].discountedSubtotal).toBe(180);
    expect(result.items[1].gstAmount).toBe(21.6);
    expect(result.items[1].lineTotal).toBe(201.6);

    // Totals: subtotal = 180+180 = 360, totalGST = 32.4+21.6 = 54, grandTotal = 414
    expect(result.subtotal).toBe(360);
    expect(result.totalGstAmount).toBe(54);
    expect(result.grandTotal).toBe(414);
  });

  /**
   * Test 11: Complex scenario with both item and bill discounts
   */
  test('should apply both item and bill discounts correctly', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 18,
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 10,
      },
    ];

    const result = calculateDiscounts(items, 'PERCENTAGE', 5, true);

    // Item: 100×3 = 300, 10% item discount = 30, discounted = 270, GST 18% = 48.6
    expect(result.items[0].discountedSubtotal).toBe(270);
    expect(result.items[0].gstAmount).toBe(48.6);

    // Bill: preDiscountGrandTotal = 270 + 48.6 = 318.6
    expect(result.preDiscountGrandTotal).toBe(318.6);

    // 5% bill discount = 318.6 × 0.05 = 15.93
    expect(result.billDiscountAmount).toBe(15.93);

    // Final: 318.6 - 15.93 = 302.67
    expect(result.grandTotal).toBe(302.67);
  });

  /**
   * Test 12: Rounding precision - ensure 2 decimal place precision throughout
   */
  test('should round all monetary values to exactly 2 decimal places', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 33.33,
        quantity: 3,
        gstRate: 7, // unusual GST rate to test rounding
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 17,
      },
    ];

    const result = calculateDiscounts(items, 'PERCENTAGE', 13, true);

    // Check that all results are rounded to 2 decimals
    const checkTwoDecimals = (value: number) => {
      const rounded = Math.round(value * 100) / 100;
      return value === rounded;
    };

    expect(checkTwoDecimals(result.items[0].baseLineTotal)).toBe(true);
    expect(checkTwoDecimals(result.items[0].itemDiscountAmount)).toBe(true);
    expect(checkTwoDecimals(result.items[0].discountedSubtotal)).toBe(true);
    expect(checkTwoDecimals(result.items[0].gstAmount)).toBe(true);
    expect(checkTwoDecimals(result.items[0].lineTotal)).toBe(true);
    expect(checkTwoDecimals(result.subtotal)).toBe(true);
    expect(checkTwoDecimals(result.totalGstAmount)).toBe(true);
    expect(checkTwoDecimals(result.preDiscountGrandTotal)).toBe(true);
    expect(checkTwoDecimals(result.billDiscountAmount)).toBe(true);
    expect(checkTwoDecimals(result.grandTotal)).toBe(true);
  });

  /**
   * Test 13: Edge case - zero quantity item
   */
  test('should handle zero quantity items', () => {
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 0,
        gstRate: 18,
        itemDiscountType: 'NONE',
        itemDiscountValue: 0,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items[0].baseLineTotal).toBe(0);
    expect(result.items[0].lineTotal).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  /**
   * Test 14: Edge case - empty items array
   */
  test('should handle empty items array', () => {
    const items: ItemInput[] = [];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    expect(result.items).toEqual([]);
    expect(result.subtotal).toBe(0);
    expect(result.totalGstAmount).toBe(0);
    expect(result.preDiscountGrandTotal).toBe(0);
    expect(result.billDiscountAmount).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  /**
   * Test 15: Real-world scenario from spec
   * Verify exact example from user story
   */
  test('should match real-world example: Rice with discount', () => {
    // Example: Rice at ₹100/unit, 3 qty, 10% item discount, 18% GST, no bill discount
    const items: ItemInput[] = [
      {
        unitPrice: 100,
        quantity: 3,
        gstRate: 18,
        itemDiscountType: 'PERCENTAGE',
        itemDiscountValue: 10,
      },
    ];

    const result = calculateDiscounts(items, 'NONE', 0, true);

    // Expected from spec:
    // - baseLineTotal: 300
    // - itemDiscountAmount: 30 (10% of 300)
    // - discountedSubtotal: 270
    // - gstAmount: 48.60 (18% of 270)
    // - lineTotal: 318.60
    // - grandTotal: 318.60

    expect(result.items[0].baseLineTotal).toBe(300);
    expect(result.items[0].itemDiscountAmount).toBe(30);
    expect(result.items[0].discountedSubtotal).toBe(270);
    expect(result.items[0].gstAmount).toBe(48.6);
    expect(result.items[0].lineTotal).toBe(318.6);
    expect(result.grandTotal).toBe(318.6);
  });
});
