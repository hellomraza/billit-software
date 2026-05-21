import { Invoice } from "@/types";
import { getRefundButtonState } from "../refund-eligibility";

function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "invoice-1",
    invoiceNumber: "INV-001",
    createdAt: "2026-05-21T10:00:00.000Z",
    isGstInvoice: true,
    paymentMethod: "CASH",
    items: [
      {
        productId: "product-1",
        productName: "Rice",
        unitPrice: 100,
        quantity: 2,
        gstRate: 5,
        gstAmount: 10,
        subtotal: 210,
      },
      {
        productId: "product-2",
        productName: "Sugar",
        unitPrice: 50,
        quantity: 1,
        gstRate: 5,
        gstAmount: 2.5,
        subtotal: 52.5,
      },
    ],
    subtotal: 250,
    totalGst: 12.5,
    grandTotal: 262.5,
    ...overrides,
  };
}

describe("refund eligibility", () => {
  test("enables refund for a refundable sale invoice", () => {
    const invoice = buildInvoice();

    expect(getRefundButtonState(invoice)).toEqual({
      kind: "enabled",
      href: "/invoices/invoice-1/refund",
    });
  });

  test("disables refund for a sync-pending invoice", () => {
    const invoice = buildInvoice({ invoiceNumber: "" });

    expect(getRefundButtonState(invoice)).toEqual({
      kind: "disabled",
      reason: "This invoice is still syncing. Wait for sync to complete.",
    });
  });

  test("disables refund when all items are fully returned", () => {
    const invoice = buildInvoice({
      refunds: [
        {
          id: "refund-1",
          invoiceNumber: "RFD-001",
          grandTotal: -210,
          createdAt: "2026-05-21T12:00:00.000Z",
          itemCount: 1,
          items: [{ productId: "product-1", quantity: 2 }],
        },
        {
          id: "refund-2",
          invoiceNumber: "RFD-002",
          grandTotal: -52.5,
          createdAt: "2026-05-21T13:00:00.000Z",
          itemCount: 1,
          items: [{ productId: "product-2", quantity: 1 }],
        },
      ],
    });

    expect(getRefundButtonState(invoice)).toEqual({
      kind: "disabled",
      reason: "All items have already been returned.",
    });
  });

  test("hides the refund button for refund invoices", () => {
    const invoice = buildInvoice({ invoiceType: "REFUND" });

    expect(getRefundButtonState(invoice)).toEqual({ kind: "hidden" });
  });
});
