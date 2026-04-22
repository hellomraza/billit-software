export type PaymentMethod = "CASH" | "CARD" | "UPI";

export interface InvoiceItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  isGstInvoice: boolean;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
}

export type InvoiceListItem = Omit<Invoice, "items">;
