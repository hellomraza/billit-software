import { Invoice } from "@/types";

let invoiceId = 1000;

export function generateMockInvoice(overrides?: Partial<Invoice>): Invoice {
  invoiceId++;
  
  return {
    id: `inv_${invoiceId}`,
    invoiceNumber: `INV-${invoiceId}`,
    createdAt: new Date().toISOString(),
    isGstInvoice: Math.random() > 0.5,
    paymentMethod: ["CASH", "CARD", "UPI"][Math.floor(Math.random() * 3)] as any,
    items: [],
    subtotal: 0,
    totalGst: 0,
    grandTotal: 0,
    ...overrides,
  };
}

export function generateMockInvoices(count: number): Invoice[] {
  return Array.from({ length: count }, () => generateMockInvoice());
}
