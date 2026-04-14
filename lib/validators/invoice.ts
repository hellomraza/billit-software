import { Invoice, InvoiceItem } from "@/types";

export type ValidationError = { field: string; message: string };

export function validateInvoice(invoice: Partial<Invoice>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!invoice.items || invoice.items.length === 0) {
    errors.push({ field: "items", message: "Invoice must have at least one item." });
  } else {
    invoice.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push({ field: `items[${index}].quantity`, message: "Quantity must be greater than zero." });
      }
    });
  }

  if (!invoice.paymentMethod) {
    errors.push({ field: "paymentMethod", message: "Payment method is required." });
  }

  return errors;
}
