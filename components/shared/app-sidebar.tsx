"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  FileText,
  Menu,
  Package2,
  Settings,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Billing", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/deficits", label: "Deficits", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Package2 className="h-6 w-6" />
          <span>BillIt MVP</span>
        </div>
      </div>
      <nav className="flex-1 overflow-auto py-4 px-3 space-y-1" role="menubar">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              role="menuitem"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* Mobile slide-in sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background flex flex-col transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!mobileOpen}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </Button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop/Tablet sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 border-r bg-background hidden md:flex flex-col transition-all duration-300 w-64 lg:w-64 md:w-20">
        {/* Desktop full sidebar */}
        <div className="hidden lg:block">
          <SidebarContent />
        </div>

        {/* Tablet icon-only sidebar */}
        <div className="hidden md:block lg:hidden flex-1 overflow-auto py-4 px-2 space-y-1">
          <div className="flex flex-col items-center justify-center h-16 border-b mb-4">
            <Package2 className="h-6 w-6 text-primary" />
          </div>
          <nav className="flex flex-col gap-2" role="menubar">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center rounded-md p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
