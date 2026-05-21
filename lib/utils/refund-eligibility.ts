import { Invoice } from "@/types";

export type RefundButtonState =
  | { kind: "hidden" }
  | { kind: "enabled"; href: string }
  | { kind: "disabled"; reason: string };

function getRefundedQuantityForProduct(invoice: Invoice, productId: string) {
  return (invoice.refunds ?? []).reduce((total, refund) => {
    const refundedQuantity = (refund.items ?? []).reduce((itemTotal, item) => {
      return item.productId === productId
        ? itemTotal + item.quantity
        : itemTotal;
    }, 0);

    return total + refundedQuantity;
  }, 0);
}

function areAllItemsFullyRefunded(invoice: Invoice) {
  if (!invoice.items.length) {
    return false;
  }

  return invoice.items.every((item) => {
    const previouslyRefundedQty = getRefundedQuantityForProduct(
      invoice,
      item.productId,
    );

    return previouslyRefundedQty >= item.quantity;
  });
}

export function getRefundButtonState(invoice: Invoice): RefundButtonState {
  if (invoice.invoiceType === "REFUND") {
    return { kind: "hidden" };
  }

  if (!invoice.invoiceNumber?.trim()) {
    return {
      kind: "disabled",
      reason: "This invoice is still syncing. Wait for sync to complete.",
    };
  }

  if (areAllItemsFullyRefunded(invoice)) {
    return {
      kind: "disabled",
      reason: "All items have already been returned.",
    };
  }

  return {
    kind: "enabled",
    href: `/invoices/${invoice.id}/refund`,
  };
}