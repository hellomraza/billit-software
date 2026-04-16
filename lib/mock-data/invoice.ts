import { Invoice } from "@/types";
import { delay } from "./delay";

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv_1",
    invoiceNumber: "SMC-DTB-0001",
    createdAt: "2024-04-12T14:30:00Z",
    customerName: "Rahul Sharma",
    customerPhone: "9876543210",
    isGstInvoice: true,
    paymentMethod: "UPI",
    items: [
      {
        productId: "p_1",
        productName: "Aashirvaad Atta 5kg",
        unitPrice: 250,
        quantity: 2,
        gstRate: 5,
        subtotal: 500,
      },
      {
        productId: "p_2",
        productName: "Tata Salt 1kg",
        unitPrice: 24,
        quantity: 1,
        gstRate: 0,
        subtotal: 24,
      },
    ],
    subtotal: 524,
    totalGst: 25, // 5% on 500
    grandTotal: 549,
  },
  {
    id: "inv_2",
    invoiceNumber: "SMC-DTB-0002",
    createdAt: "2024-04-13T09:15:00Z",
    isGstInvoice: false,
    paymentMethod: "CASH",
    items: [
      {
        productId: "p_3",
        productName: "Maggi Noodles Multi-pack",
        unitPrice: 140,
        quantity: 1,
        gstRate: 18,
        subtotal: 140,
      },
    ],
    subtotal: 140,
    totalGst: 0, // Non-GST invoice
    grandTotal: 140,
  },
];

export async function getInvoices() {
  await delay(500);
  // Load from localStorage first
  if (typeof window !== "undefined") {
    const savedInvoicesStr = localStorage.getItem("billit_invoices");
    if (savedInvoicesStr) {
      const savedInvoices = JSON.parse(savedInvoicesStr);
      // Combine mock invoices with saved invoices
      return [...MOCK_INVOICES, ...savedInvoices];
    }
  }
  return MOCK_INVOICES;
}

export async function getInvoiceById(id: string) {
  await delay(300);
  // Check localStorage first
  if (typeof window !== "undefined") {
    const savedInvoicesStr = localStorage.getItem("billit_invoices");
    if (savedInvoicesStr) {
      const savedInvoices = JSON.parse(savedInvoicesStr);
      const found = savedInvoices.find((i: Invoice) => i.id === id);
      if (found) return found;
    }
  }
  return MOCK_INVOICES.find((i) => i.id === id) || null;
}

export async function saveInvoice(invoice: Invoice) {
  await delay(200);
  if (typeof window !== "undefined") {
    const savedInvoicesStr = localStorage.getItem("billit_invoices");
    const savedInvoices = savedInvoicesStr ? JSON.parse(savedInvoicesStr) : [];
    savedInvoices.push(invoice);
    localStorage.setItem("billit_invoices", JSON.stringify(savedInvoices));
  }
  return invoice;
}
