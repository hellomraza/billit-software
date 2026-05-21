export type PaymentMethod = "CASH" | "CARD" | "UPI";

export interface InvoiceItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  subtotal: number;
  gstAmount: number;
  itemDiscountType?: "NONE" | "PERCENTAGE" | "FLAT";
  itemDiscountValue?: number;
  itemDiscountAmount?: number;
}

export interface InvoiceRefundItem {
  productId: string;
  quantity: number;
}

export interface InvoiceRefundSummary {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  createdAt: string;
  itemCount: number;
  items?: InvoiceRefundItem[];
}

export interface InvoiceOriginalSummary {
  id: string;
  invoiceNumber: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  invoiceType?: "SALE" | "REFUND";
  isGstInvoice: boolean;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  refunds?: InvoiceRefundSummary[];
  originalInvoice?: InvoiceOriginalSummary;
  refundReason?: string;
  subtotal: number;
  totalGst: number;
  grandTotal: number;
}

export type InvoiceListItem = Omit<Invoice, "items">;
