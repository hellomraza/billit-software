// Tenant
export interface Tenant {
  _id: string;
  email: string;
  businessName: string;
  businessAbbr: string;
  onboardingComplete: boolean;
  gstNumber?: string;
  gstEnabled: boolean;
  abbrLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Outlet
export interface Outlet {
  _id: string;
  tenantId: string;
  outletName: string;
  outletAbbr: string;
  isDefault: boolean;
  abbrLocked: boolean;
  createdAt: string;
}

// Product
export interface Product {
  _id: string;
  tenantId: string;
  name: string;
  basePrice: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
  deficitThreshold: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// StockRecord
export interface StockRecord {
  _id: string;
  productId: string;
  outletId: string;
  quantity: number;
  updatedAt: string;
}

// ProductWithStock (combined for product list)
export interface ProductWithStock extends Product {
  stock?: number;
}

// Invoice Item
export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
  override?: boolean;
}

// Invoice
export interface Invoice {
  _id: string;
  tenantId: string;
  outletId: string;
  invoiceNumber: string;
  clientGeneratedId: string;
  items: InvoiceItem[];
  subtotal: number;
  totalGstAmount: number;
  grandTotal: number;
  paymentMethod: "CASH" | "CARD" | "UPI";
  customerName?: string;
  customerPhone?: string;
  isGstInvoice: boolean;
  tenantGstNumber?: string;
  isDeleted: boolean;
  createdAt: string;
}

// Deficit Record
export interface DeficitRecord {
  _id: string;
  tenantId: string;
  productId: string;
  outletId: string;
  quantity: number;
  linkedInvoiceId: string;
  status: "PENDING" | "RESOLVED";
  resolutionMethod?: "STOCK_ADDITION" | "ADJUSTMENT";
  adjustmentReason?: "DAMAGE" | "LOSS" | "CORRECTION";
  resolvedAt?: string;
  createdAt: string;
}

// Grouped deficit (for deficit management screen)
export interface DeficitGroup {
  productId: string;
  productName: string;
  totalPendingQuantity: number;
  recordCount: number;
  mostRecentDate: string;
  deficitThreshold: number;
  records: DeficitRecord[];
}

// Onboarding Status
export interface OnboardingStatus {
  businessStep: boolean;
  outletStep: boolean;
  completedAt?: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Invoice creation - insufficient stock response
export interface InsufficientStockItem {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
  deficitThresholdExceeded: boolean;
}

export interface InsufficientStockResponse {
  status: "STOCK_INSUFFICIENT";
  insufficientItems: InsufficientStockItem[];
}

// Invoice creation success response
export interface InvoiceCreatedResponse {
  invoiceId: string;
  invoiceNumber: string;
  createdAt: string;
  items: InvoiceItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: string;
  customerDetails: { name?: string; phone?: string };
  gstDetails: { enabled: boolean; gstNumber?: string };
  abbreviationsLocked: boolean;
}
