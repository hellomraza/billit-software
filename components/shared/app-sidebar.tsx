"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, FileText, ShoppingCart, AlertTriangle, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Billing", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/deficits", label: "Deficits", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-background hidden md:flex flex-col">
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Package2 className="h-6 w-6" />
          <span>BillIt MVP</span>
        </div>
      </div>
      <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t text-sm text-muted-foreground">
        <p>SMC Branch</p>
      </div>
    </aside>
  );
}
