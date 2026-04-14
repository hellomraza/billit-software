import { FileText, Package2, Settings, ShoppingCart, AlertTriangle } from "lucide-react";

export const MAIN_NAV_ITEMS = [
  { href: "/", label: "Billing", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/deficits", label: "Deficits", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];
